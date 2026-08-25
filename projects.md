---
title: Projects
permalink: /projects/
---

<div class="crumb">Projects</div>
<h1 class="post-title" style="margin-bottom:48px;">Open-source work</h1>

{% for project in site.data.projects %}
  <div class="proj">
    <div>
      <div class="name-row"><a href="{{ project.url }}">{{ project.title }}</a></div>
      <p class="desc">{{ project.summary }}</p>
    </div>
    <span class="tags">{% for tag in project.tags %}{{ tag | downcase }}{% unless forloop.last %} · {% endunless %}{% endfor %}</span>
  </div>
{% endfor %}
