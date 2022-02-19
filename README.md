<p align="center">
	<img src="./logo.png" height="150" width="150" alt="icon example" />
</p>	

<h3 align="center">
  Send diverse contents to your Kindle 📚️
</h3>

<p align="center">
	<a href="https://github.com/microsoft/TypeScript">
		<img alt="typescript" src="https://camo.githubusercontent.com/41c68e9f29c6caccc084e5a147e0abd5f392d9bc/68747470733a2f2f62616467656e2e6e65742f62616467652f547970655363726970742f7374726963742532302546302539462539322541412f626c7565">
	</a>
</p>

## 📌 Overview

That's a way to automatically sync data with your kindle, such as RSS feeds, manga, and too much more.

## 🎩 Getting Started

This repository is a Github Action so you can configure a cron job with Github Actions to run it and sync the contents with your kindle in the way to prefer.

Below you can see an example of a configuration yaml that syncs contents with kindle every day at midnight *(be aware to pass the sender credentials as github secrets to avoid exposing it to the public)*:

```yml
on:
  schedule:
    - cron: '0 0 * * *'

jobs:
  kindlefy:
    runs-on: ubuntu-latest
    name: Sync kindle contents.
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Kindlefy
        uses: gbkel/kindlefy@v1.2.6
        with:
          kindle_email: 'test@kindle.com'
          sender: '[{ "type": "gmail", "email": "test@gmail.com", "password": "password" }]'
          sources: '[{ "type": "manga", "name": "One Piece" }, { "type": "rss", "url": "https://dev.to/feed" }]'
          storage: '[{ "type": "local", "githubAccessToken": ${{ secrets.GITHUB_TOKEN }} }]'
          no_duplicated_sync: true
```

### Sender

We recommend you to create a new email to use as a sender since some services need to disable extra auth in other to be able to send emails by smtp.

For now we have the current senders available:

**Gmail**

In order to use Gmail, you need to [Disable Unlock Captcha](https://accounts.google.com/DisplayUnlockCaptcha), Disable Two Factor Auth, [Enable Less Secure Apps Access](https://myaccount.google.com/lesssecureapps).

```json
{
	"type": "gmail",
	"email": "youremail@gmail.com",
	"password": "yourpassword"
}
```

**Outlook**

```json
{
	"type": "outlook",
	"email": "youremail@outlook.com",
	"password": "yourpassword"
}
```

**SMTP**

```json
{
	"type": "smtp",
	"email": "youremail@mail.com",
	"host": "host",
	"user": "user",
	"password": "password",
	"port": "port"
}
```

### Source

For now we have the following sources available to import contents to kindle *(the contents usually come in descending creation order)*:

**Manga**

```json
{
	"type": "manga",
	"name": "some manga name",
	"count": 1 // Most recent chapters count
}
```

**RSS**

```json
{
	"type": "rss",
	"url": "url"
}
```

### Storage

In case you want to avoid duplicated sync, you can use a storage to save sync history. After adding a storage config, you need to set the 'no_duplicated_sync' environment variable to true in order to use it. Currently we have the following storages:

**Local**

It saves the sync history inside the repository this action is currently running on. You need to give Kindlefy a github access token in order to edit the repository, usually when we are using a Github Action, it automatically sets up a variable called GITHUB_TOKEN on the build context that can be used as shown below.

```json
{
	"type": "local",
	"githubAccessToken": "${{ secrets.GITHUB_TOKEN }}" // Default variable from Github Action
}
```

## 🕋 Features

- [X] Send to Kindle by Gmail.

- [X] Send to Kindle by Outlook.

- [X] Send to Kindle by a generic SMTP Server.

- [X] Import Manga.

- [X] Import RSS Feed.

- [X] Import Full Medium RSS Feeds.

- [ ] Choosing which collection to put the documents.

- [ ] Sending more than one document per mail.

- [ ] Using an own Docker Image (builded with the Dockerfile inside this repo) to improve action speed.

- [X] Adding support for database to persist sync history and avoid data duplication on kindle (such as using MongoDB, Github Repository, etc.).

- [ ] Adding correct metadata for documents (cover, author and all other missing metadata).

## 🔧 Technologies

- Typescript
- Husky
- Lint Staged
- ESLint
- Git Commit Message Linter
- Cheerio
- Nodemailer
- Calibre

## 🚀 Development Environment

You just need to clone this repository inside your machine and run the following commands:

```sh
npm install
npm run dev
```

**Obs:**

- It is needed to have [Calibre](https://calibre-ebook.com/download) installed locally.
