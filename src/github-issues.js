import axios from 'axios' // ajax library
import serialization from './github-serialization.js'
import auth from './github-oauth.js'

/*
 * GitHub Issues API. Handles saving and polling of 
 * projects, stored as github issue comments.
 *
 * Expects a configuration of:
 * {
 *    organization: "bkkhack",
 *    repository: "hackmap",
 *    label: "BKKHack Main Thread",
 *    pollIntervalSeconds: 60,
 *    onAuthenticationRequired: () => Promise(token)
 *    onProjectsUpdated: (projects) => ()
 * }
 */
export default class GitHubIssueService {
    constructor(config) {
        this.config = config;
        this.ajax = this.createGithubApiClient(config.organization, config.repository);

        // if the user has already logged in (e.g. in a previous session), use the
        // authenticated client for all operations. Authenticated calls have a
        // higher rate limit, even for calls that don't require authentication
        if(auth.isLoggedIn()) {
            this.ensureAuthenticatedClient();
        }

        // issue ajax requests to load data from github
        // the model will be updated periodically from the callbacks
        this.ajax.get('issues', { params: { labels: this.config.label } })
            .then(issueResponse => {
                if(!(issueResponse.data || issueResponse.data.length)) {
                    throw "Could not find an open issue labeled: " + this.config.label;
                }
                this.issueNumber = issueResponse.data[0].number;
            })
            .then(() => this.pollIssueForComments())
            .catch(err => this.reportError(err));
    }

    postNewProject(project) {
        return this.ensureAuthenticatedClient()
            .then(() => {
                let body = serialization.serializeProjectToComment(project);
                return this.ajax
                    .post('issues/' + this.issueNumber + '/comments', { body: body });
            })
            .then((response) => {
                return serialization.deserializeCommentToProject(response.data);
            });
    }

    updateProject(project) {
        return this.ensureAuthenticatedClient()
            .then(() => {
                let body = serialization.serializeProjectToComment(project);
                return this.ajax.patch('issues/comments/' + project.id, { body: body });
            })
            .then(response => {
                return serialization.deserializeCommentToProject(response.data);
            });
    }

    pollIssueForComments() {
        var commentsUrl = "issues/" + this.issueNumber  + "/comments";

        var poll = () => {
            console.log("polling...");
            return this.ajax.get(commentsUrl)
                            .then((response) => {
                                var projects = response.data
                                    .map(serialization.deserializeCommentToProject);
                                this.config.onProjectsUpdated(projects);
                            })
                            .catch((err) => this.reportError(err));
        }

        window.setInterval(poll, 1000 * this.config.pollIntervalSeconds);
        return poll();
    }

    ensureAuthenticatedClient() {
        return this.config.onAuthenticationRequired()
            .then(token => {
                this.ajax = this.createGithubApiClient(
                        this.config.organization,
                        this.config.repository,
                        token);
            });
    }

    createGithubApiClient(org, repo, token) {
        var ajaxConfig = {
            baseURL: 'https://api.github.com/repos/' + org + '/' + repo + '/',
        };
        if(token) {
            ajaxConfig.headers = {
                'Authorization': 'token ' + token
            };
        }
        return axios.create(ajaxConfig);
    }

    reportError(err) {
        console.log(err);
    }
}
