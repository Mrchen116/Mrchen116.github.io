---
title: About
---

<header>
  <h1 class="name">Chen, Zijian</h1>
  <p class="tagline">Trying my best to deliver every job a human can do — to agents.</p>
  <p class="bio">Agent Engineer. <em>MS in Artificial Intelligence, Beijing University of Posts and Telecommunications (2022–2025). BS in Software Engineering, Shenzhen University (2018–2022).</em></p>
  <p class="bio">Working on multi-modal LLMs, agent orchestration, and the boring infrastructure that makes them reliable. This site is where I keep notes I would rather not lose.</p>
</header>

{% assign writings = site.posts | concat: site.articles | sort: "date" | reverse %}

<section>
  <h2>Recent writing</h2>
  {% for w in writings limit:5 %}
    <div class="entry">
      <span class="date">{{ w.date | date: "%Y·%m·%d" }}</span>
      <div>
        <div class="title"><a href="{{ w.url | relative_url }}">{{ w.title }}</a>{% if w.kind == 'article' %}<span class="badge">article</span>{% endif %}</div>
        {% if w.excerpt %}<p class="sum">{{ w.excerpt | strip_html | truncate: 160 }}</p>{% endif %}
      </div>
    </div>
  {% endfor %}
  <p style="margin-top:18px;"><a href="{{ '/writing/' | relative_url }}" class="mono" style="font-size:12px; color:var(--muted); text-decoration:none;">All writing →</a></p>
</section>

<section>
  <h2>Open source</h2>
  {% for project in site.data.projects %}
    <div class="proj">
      <div>
        <div class="name-row"><a href="{{ project.url }}">{{ project.title }}</a></div>
        <p class="desc">{{ project.summary }}</p>
      </div>
      <span class="tags">{% for tag in project.tags %}{{ tag | downcase }}{% unless forloop.last %} · {% endunless %}{% endfor %}</span>
    </div>
  {% endfor %}
</section>

<section>
  <h2>Elsewhere</h2>
  <div class="connect">
    <a href="https://github.com/{{ site.author.github }}">GitHub <span class="arrow">↗</span></a>
    <a href="#" data-u="{{ site.contact_user }}" data-h="{{ site.contact_host }}">Email <span class="arrow">↗</span></a>
  </div>
</section>
