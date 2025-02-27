import { pathToFileURL } from "node:url";
import { isNil } from "@oliversalzburg/js-utils/data/nil.js";
import { redirectErrorsToStream } from "@oliversalzburg/js-utils/errors/stream.js";
import { readFile } from "fs/promises";
import { parse } from "yaml";

const args = process.argv.splice(2);

interface ProjectConfig {
  org: string;
  repo: string;
  /***
   * The name of the default branch.
   */
  main?: string;
  name: string;
  description: string;
  activeMaintenance?: boolean;
  hasReleases?: boolean;
  checks?: Array<string>;
}

interface GroupConfig {
  title: string;
  projects: Array<ProjectConfig>;
}

interface ReadmeConfig {
  projects: Array<GroupConfig>;
  suffix?: string;
}

const BADGE_STYLE = "style=flat-square&labelColor=%230008";

const defaultBranchCheck = (project: ProjectConfig) => {
  return `[![GitHub branch check runs](https://img.shields.io/github/check-runs/${project.org}/${project.repo}/${project.main ?? "main"}?${BADGE_STYLE})](https://github.com/${project.org}/${project.repo}/actions)`;
};
const workflowStatus = (project: ProjectConfig, workflow: string) => {
  return `[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/${project.org}/${project.repo}/${workflow}.yml?label=${workflow}&${BADGE_STYLE})](https://github.com/${project.org}/${project.repo}/actions)`;
};
const commitsSinceRelease = (project: ProjectConfig) => {
  return `[![GitHub commits since latest release](https://img.shields.io/github/commits-since/${project.org}/${project.repo}/latest?${BADGE_STYLE})](https://github.com/${project.org}/${project.repo}/releases)`;
};

/**
 * Main entrypoint
 * @param configFilename - The name of the configuration file to process.
 * @returns The resulting GitHub profile README.
 */
export const main = async (configFilename: string) => {
  const fileContents = await readFile(configFilename, "utf-8");
  const configObject = parse(fileContents) as ReadmeConfig;

  const document = new Array<string>();
  for (const group of configObject.projects) {
    document.push(`## ${group.title}\n`);

    for (const project of group.projects) {
      document.push(
        `* [${project.name}](https://github.com/${project.org}/${project.repo})${project.activeMaintenance ? " ⭐" : ""}  `,
      );
      document.push(`   ${project.description}  `);
      if (!isNil(project.checks)) {
        document.push(
          `   ${project.checks
            .map(workflow => workflowStatus(project, workflow))
            .concat(project.hasReleases ? [commitsSinceRelease(project), "\n"] : ["\n"])
            .join(" ")}`,
        );
      } else {
        document.push(
          `   ${defaultBranchCheck(project)}${project.hasReleases ? " " + commitsSinceRelease(project) : ""}\n`,
        );
      }
    }
  }

  document.push(configObject.suffix ?? "");

  return document.join("\n");
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(args[0])
    .then(document => process.stdout.write(document))
    .catch(redirectErrorsToStream(process.stderr));
}
