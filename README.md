# Rihaan Meher — Academic Portfolio

A minimalist personal portfolio for **Rihaan Meher**, high school student researcher and software developer (Pine Crest School, Class of 2030).

The site is intended as a straightforward, readable overview of research, awards, software projects, technical experience, and academic interests.

## Site contents

- **Research** — ClimateStrike AI and AI-assisted recyclable-material sorting, with project links and notable recognition.
- **Honors** — regional, state, and national research competition results from the resume.
- **Software** — InferencePort AI and reStructuredPython.
- **Experience** — open-source contributions, security research, and technical skills.
- **About** — education, school honors, and extracurricular interests.

Content is based on the portfolio owner's resume and linked public projects. Awards and download counts reflect the details supplied by the owner.

## Design

- Plain HTML and CSS, with no JavaScript or build process.
- System font stack; no Google Fonts or external design dependencies.
- Responsive, accessible layout with semantic headings, keyboard-focus indicators, and reduced-motion support.
- No decorative mockups or stock photography.

## Local preview

From the repository root:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`.

## Deployment

The existing `CNAME` file points to `rihaanmeher.com`. The site can be served directly from the root of `main` via GitHub Pages (**Settings → Pages → Deploy from a branch → main → /(root)**). Ensure the custom domain's DNS is configured according to [GitHub Pages documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site). GitHub Pages settings, DNS and HTTPS are separate from a repository commit.

## Maintenance

- `index.html` — text, sections, links, and metadata
- `styles.css` — all presentation and responsive rules
- `favicon.svg` — small typographic icon

The original repository license is retained in `LICENSE`.
