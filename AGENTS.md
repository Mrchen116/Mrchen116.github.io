# AGENTS.md

## Project

This is a Jekyll-based GitHub Pages personal site.

Key files:
- `index.md`: home page
- `writing.md`: writing index
- `projects.md` and `_data/projects.yml`: project listing
- `_posts/`: Markdown notes
- `_articles/`: converted long-form HTML articles
- `drafts/`: standalone HTML source drafts
- `assets/css/style.scss`: global site style
- `assets/css/article.css`: shared article style
- `tools/convert.py`: converts standalone draft HTML into `_articles/`

## Generated And Vendor Files

Do not manually edit:
- `_site/`
- `.jekyll-cache/`
- `vendor/`
- `slides/node_modules/`

These are generated or installed artifacts.

## Local Development

Use the Homebrew Ruby toolchain for this repo:

```bash
/opt/homebrew/Cellar/ruby/4.0.5/bin/bundle
```

Do not use the system `/usr/bin/bundle`; `Gemfile.lock` is locked to Bundler
`4.0.11`, which the system Ruby cannot run.

Dependencies are already available in the Homebrew Ruby gem environment. If
Bundler reports missing gems, inspect `bundle config list` before changing
install paths. Do not use Bundler 4's removed `--path` flag.

Install or refresh dependencies only when needed:

```bash
/opt/homebrew/Cellar/ruby/4.0.5/bin/bundle install
```

Serve locally:

```bash
/opt/homebrew/Cellar/ruby/4.0.5/bin/bundle exec jekyll serve
```

Open `http://127.0.0.1:4000`.

If `4000` is already in use, choose another local port:

```bash
/opt/homebrew/Cellar/ruby/4.0.5/bin/bundle exec jekyll serve --host 127.0.0.1 --port 4001
```

Build check:

```bash
/opt/homebrew/Cellar/ruby/4.0.5/bin/bundle exec jekyll build
```

## Writing

Before adding or changing posts, articles, article assets, or article tooling,
read `ARTICLE_GUIDE.md` and follow it as the source of truth.

## Style

Keep the existing visual direction:
- serif editorial layout
- restrained rust accent color
- no broad redesign unless explicitly requested
- avoid adding one-off global CSS for a single article
- prefer existing article components from `ARTICLE_GUIDE.md`
