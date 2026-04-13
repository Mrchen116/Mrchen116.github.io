# Chen, Zijian Personal Site

This repository contains a Jekyll-based GitHub Pages site for a personal academic-style homepage with:

- a short introduction on the home page
- selected projects
- technical posts
- room for future publications

## Local development

1. Install Ruby and Bundler.
2. Run `BUNDLE_FORCE_RUBY_PLATFORM=true bundle install --path vendor/bundle`.
3. Run `BUNDLE_FORCE_RUBY_PLATFORM=true bundle exec jekyll serve`.
4. Open `http://127.0.0.1:4000`.

The local development setup uses a lightweight `jekyll` gem so it can run on older Ruby environments more easily. The generated site remains compatible with GitHub Pages because it only uses standard Jekyll features.

## Content structure

- `index.md`: home page
- `_data/projects.yml`: project list
- `projects.md`: all projects
- `posts.md`: post archive
- `_posts/`: blog posts
- `assets/css/style.scss`: site styling

## Next planned step

- Add a dedicated `Publications` page once there are enough papers or preprints to justify a separate section.
