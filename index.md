---
title: About
---

<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow">Researcher & Engineer</p>
    <h1>Chen, Zijian</h1>
    <p class="lead">
      I build open-source software, write technical notes, and document project
      learnings. This site is a focused record of what I am building and what I
      am learning.
    </p>
    <p class="hero-links">
      <a href="https://github.com/Mrchen116">GitHub</a>
    </p>
  </div>
</section>

<section class="section-block">
  <div class="section-header">
    <p class="eyebrow">Selected Work</p>
    <h2>Recent Projects</h2>
  </div>
  <div class="card-grid">
    {% for project in site.data.projects limit:2 %}
      <article class="card">
        <h3><a href="{{ project.url }}">{{ project.title }}</a></h3>
        <p>{{ project.summary }}</p>
        <p class="meta">
          {% for tag in project.tags %}
            <span>{{ tag }}</span>
          {% endfor %}
        </p>
      </article>
    {% endfor %}
  </div>
  <p class="section-link"><a href="{{ '/projects/' | relative_url }}">View all projects</a></p>
</section>

<section class="section-block">
  <div class="section-header">
    <p class="eyebrow">Writing</p>
    <h2>Latest Posts</h2>
  </div>
  <div class="list-block">
    {% for post in site.posts limit:3 %}
      <article class="list-item">
        <p class="meta">{{ post.date | date: "%b %d, %Y" }}</p>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.excerpt %}
          <p>{{ post.excerpt | strip_html | truncate: 140 }}</p>
        {% endif %}
      </article>
    {% endfor %}
  </div>
  <p class="section-link"><a href="{{ '/posts/' | relative_url }}">Browse all posts</a></p>
</section>

<section class="section-block">
  <div class="section-header">
    <p class="eyebrow">Notes</p>
    <h2>Publications</h2>
  </div>
  <p>
    A dedicated publications page will be added later as papers and write-ups
    accumulate. For now, this site focuses on projects and technical posts.
  </p>
</section>
