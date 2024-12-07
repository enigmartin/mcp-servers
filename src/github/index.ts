#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  CreateBranchOptionsSchema,
  CreateBranchSchema,
  CreateIssueOptionsSchema,
  CreateIssueSchema,
  CreateOrUpdateFileSchema,
  CreatePullRequestOptionsSchema,
  CreatePullRequestSchema,
  CreateRepositoryOptionsSchema,
  CreateRepositorySchema,
  ForkRepositorySchema,
  GetFileContentsSchema,
  GitHubCommitSchema,
  GitHubContentSchema,
  GitHubCreateUpdateFileResponseSchema,
  GitHubForkSchema,
  GitHubIssueSchema,
  GitHubListCommits,
  GitHubListCommitsSchema,
  GitHubPullRequestSchema,
  GitHubReferenceSchema,
  GitHubRepositorySchema,
  GitHubSearchResponseSchema,
  GitHubTreeSchema,
  IssueCommentSchema,
  ListCommitsSchema,
  ListIssuesOptionsSchema,
  PushFilesSchema,
  SearchCodeResponseSchema,
  SearchCodeSchema,
  SearchIssuesResponseSchema,
  SearchIssuesSchema,
  SearchRepositoriesSchema,
  SearchUsersResponseSchema,
  SearchUsersSchema,
  UpdateIssueOptionsSchema,
} from './schemas.js';

// Custom error class for GitHub API errors
class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public method?: string,
    public path?: string,
    public response?: any
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

// Error handling utilities
async function handleGitHubResponse(response: Response, context: string): Promise<any> {
  if (!response.ok) {
    let errorMessage = `GitHub API error (${response.status})`;
    let errorDetails = '';

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorDetails = errorData.message;
      }
    } catch (e) {
      // If we can't parse the error response, use the statusText
      errorDetails = response.statusText;
    }

    // Handle specific error cases
    switch (response.status) {
      case 401:
        throw new GitHubAPIError(
          `Authentication failed while ${context}: ${errorDetails}`,
          response.status,
          response.type,
          response.url
        );
      case 403:
        if (errorDetails.includes('rate limit exceeded')) {
          throw new GitHubAPIError(
            `Rate limit exceeded while ${context}. Please try again later.`,
            response.status,
            response.type,
            response.url
          );
        }
        throw new GitHubAPIError(
          `Access denied while ${context}: ${errorDetails}`,
          response.status,
          response.type,
          response.url
        );
      case 404:
        throw new GitHubAPIError(
          `Resource not found while ${context}: ${errorDetails}`,
          response.status,
          response.type,
          response.url
        );
      case 422:
        throw new GitHubAPIError(
          `Invalid request while ${context}: ${errorDetails}`,
          response.status,
          response.type,
          response.url
        );
      default:
        throw new GitHubAPIError(
          `${errorMessage} while ${context}: ${errorDetails}`,
          response.status,
          response.type,
          response.url
        );
    }
  }

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    throw new GitHubAPIError(
      `Failed to parse GitHub API response while ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      response.status,
      response.type,
      response.url
    );
  }
}

// Content handling utilities
function encodeContent(content: string): string {
  try {
    return Buffer.from(content).toString('base64');
  } catch (error) {
    throw new Error(`Failed to encode content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function decodeContent(content: string): string {
  try {
    return Buffer.from(content, 'base64').toString('utf8');
  } catch (error) {
    throw new Error(`Failed to decode content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

[... rest of the file remains unchanged from the previous version ...]