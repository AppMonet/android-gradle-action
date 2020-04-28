#!/usr/bin/env node
const report = require(process.argv[2]);
const fs = require('fs');
const path = require('path');
const https = require("https");
const actionName = "Infer Android";

const context = {
  token: process.env['GITHUB_TOKEN'],
  repo: process.env['GITHUB_REPOSITORY'],
  sha: process.env['GITHUB_SHA'],
  eventPath: process.env["GITHUB_EVENT_PATH"],
  ref: process.env['GITHUB_REF'],
  eventName: process.env["GITHUB_EVENT_NAME"],
};

/**
 * Helper function for making HTTP requests
 * @param {string | URL} url - Request URL
 * @param {object} options - Request options
 * @returns {Promise<object>} - JSON response
 */
function request(url, options) {
	return new Promise((resolve, reject) => {
		const req = https
			.request(url, options, (res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					if (res.statusCode >= 400) {
						const err = new Error(`Received status code ${res.statusCode}`);
						err.response = res;
						err.data = data;
						reject(err);
					} else {
						resolve({ res, data: JSON.parse(data) });
					}
				});
			})
			.on("error", reject);
		if (options.body) {
			req.end(JSON.stringify(options.body));
		} else {
			req.end();
		}
	});
}

function parseBranch(eventName, event) {
	if (eventName === "push") {
		return event.ref.substring(11); // Remove "refs/heads/" from start of string
	}
	if (eventName === "pull_request") {
		return event.pull_request.head.ref;
	}
	throw Error(`${actionName} does not support "${eventName}" GitHub events`);
}

function parseRepository(eventName, event) {
	const repoName = event.repository.full_name;
	let forkName;
	if (eventName === "pull_request") {
		// "pull_request" events are triggered on the repository where the PR is made. The PR branch can
		// be on the same repository (`forkRepository` is set to `null`) or on a fork (`forkRepository`
		// is defined)
		const headRepoName = event.pull_request.head.repo.full_name;
		forkName = repoName === headRepoName ? undefined : headRepoName;
	}
	return {
		repoName,
		forkName,
		hasFork: forkName != null && forkName !== repoName,
	};
}

const event = JSON.parse(fs.readFileSync(context.eventPath).toString());
const repo = parseRepository(context.eventName, event);
const branch = parseBranch(context.eventName, event);

console.info(`submitting infer output for ${repo.repoName}:${branch}`);

let errorCount = 0;
const annotations = report.slice(0, 50).map((item) => {
  errorCount += item.severity === 'WARNING' ? 0 : 1;
  return ({
    path: item.file,
    start_line: item.line,
    end_line: item.line,
    annotation_level: item.severity === 'WARNING' ? 'warning' : 'failure',
    message: `${item.bug_type}: ${item.qualifier}`
  });
});

const payload = {
  name: "Infer",
  head_sha: context.sha,
  conclusion: errorCount > 0 ? "failure" : "success",
  output: {
    title: `Infer found ${errorCount} Errors`,
    summary: `Infer found ${errorCount} Errors`,
    annotations,
  },
};

console.info(`submitting ${annotations.length} annotations`, annotations[0])
request(`https://api.github.com/repos/${repo.repoName}/check-runs`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/vnd.github.antiope-preview+json",
    Authorization: `Bearer ${context.token}`,
    "User-Agent": "Infer Android",
  },
  body: payload
}).then(() => {
  console.info("submitted check successfully");
}).catch((e) => {
  console.error("failed to submit check: ", e.data);
});

