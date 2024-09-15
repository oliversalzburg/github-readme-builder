import { isNil } from "@oliversalzburg/js-utils/data/nil.js";
import { redirectErrorsToStream } from "@oliversalzburg/js-utils/errors/stream.js";
import { readFile } from "fs/promises";
import { parse } from "yaml";

const args = process.argv.splice(2);
const configFilename = args[0];

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

const BADGE_STYLE = "style=flat-square";

const defaultBranchCheck = (project: ProjectConfig) => {
  return `![GitHub branch check runs](https://img.shields.io/github/check-runs/${project.org}/${project.repo}/${project.main ?? "main"}?${BADGE_STYLE})`;
};
const workflowStatus = (project: ProjectConfig, workflow: string) => {
  return `![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/${project.org}/${project.repo}/${workflow}.yml?label=${workflow}&${BADGE_STYLE})`;
};
const commitsSinceRelease = (project: ProjectConfig) => {
  return `![GitHub commits since latest release](https://img.shields.io/github/commits-since/${project.org}/${project.repo}/latest?${BADGE_STYLE})`;
};

const main = async () => {
  const fileContents = await readFile(configFilename, "utf-8");
  const configObject = parse(fileContents) as ReadmeConfig;

  const document = new Array<string>();
  for (const group of configObject.projects) {
    document.push(`## ${group.title}\n`);

    for (const project of group.projects) {
      document.push(
        `1. [${project.name}](https://github.com/${project.org}/${project.repo})${project.activeMaintenance ? " ⭐" : ""}  `,
      );
      if (!isNil(project.checks)) {
        document.push(
          `   ${project.checks
            .map(workflow => workflowStatus(project, workflow))
            .concat(project.hasReleases ? [commitsSinceRelease(project), " "] : [" "])
            .join(" ")}`,
        );
      } else {
        document.push(
          `   ${defaultBranchCheck(project)}${project.hasReleases ? " " + commitsSinceRelease(project) : ""}  `,
        );
      }
      document.push(`   ${project.description}\n`);
    }

    document.push(`\n`);
  }
  document.push(configObject.suffix ?? "");

  process.stdout.write(document.join("\n"));
};

main().catch(redirectErrorsToStream(process.stderr));
