---
title: Posts
permalink: /posts/
---

<section class="section-header">
  <p class="eyebrow">Posts</p>
  <h1>Technical notes and project write-ups</h1>
  <p>
    Short essays, implementation notes, and project retrospectives.
  </p>
</section>

<div class="list-block">
  {% for post in site.posts %}
    <article class="list-item">
      <p class="meta">{{ post.date | date: "%b %d, %Y" }}</p>
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <p>{{ post.excerpt | strip_html | truncate: 180 }}</p>
    </article>
  {% endfor %}
</div>
