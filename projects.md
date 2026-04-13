---
title: Projects
permalink: /projects/
---

<section class="section-header">
  <p class="eyebrow">Projects</p>
  <h1>Open-source work</h1>
  <p>
    A concise list of current projects, with links to the source repositories.
  </p>
</section>

<div class="card-grid">
  {% for project in site.data.projects %}
    <article class="card">
      <h2><a href="{{ project.url }}">{{ project.title }}</a></h2>
      <p>{{ project.summary }}</p>
      <p class="meta">
        {% for tag in project.tags %}
          <span>{{ tag }}</span>
        {% endfor %}
      </p>
    </article>
  {% endfor %}
</div>
