---
title: Writing
permalink: /writing/
---

<div class="crumb">Writing</div>
<h1 class="post-title">Notes &amp; deep articles</h1>
<p class="tagline" style="margin-bottom:48px;">Short Markdown notes and longer HTML pieces, in chronological order.</p>

{% assign writings = site.posts | concat: site.articles | sort: "date" | reverse %}

{% for w in writings %}
  <div class="entry">
    <span class="date">{{ w.date | date: "%Y·%m·%d" }}</span>
    <div>
      <div class="title"><a href="{{ w.url | relative_url }}">{{ w.title }}</a>{% if w.kind == 'article' %}<span class="badge">article</span>{% endif %}</div>
      {% if w.excerpt %}<p class="sum">{{ w.excerpt | strip_html | truncate: 180 }}</p>{% endif %}
    </div>
  </div>
{% endfor %}
