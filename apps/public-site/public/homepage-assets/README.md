# Homepage Imagery — Curation Guide

This folder controls every rotating/curated image on the homepage. You do
not need to edit any code to change what visitors see — just add, remove,
rename, or reorder files in these folders and rebuild/redeploy the site.

## hero/
The main hero background at the very top of the homepage. Every image in
this folder rotates slowly behind the "Design. Build. Deliver." headline —
the text never moves, only the background crossfades.

- Drop in any number of images (JPG, PNG, WebP, or AVIF).
- They play in filename order — that's why the current files are named
  `01-...`, `02-...`, `03-...`, `04-...`. Rename a file to `00-...` to make
  it play first, or renumber the set to reorder.
- Use only your strongest, most "first impression" flagship photography —
  keep this to a handful of images (4–6 max). A long rotation dilutes the
  effect and slows down how often visitors see your very best work.
- The first image (alphabetically) is loaded with top browser priority, so
  put your single best shot first.

## precision/
The rotating image beside "Precision in Every Dimension" — the section just
below the hero. Same rules as `hero/`: any number of images, filename order,
number-prefix to reorder.

- This one has no text overlaid on top of it, so images show at full
  brightness — pick shots where detail, materials, and craftsmanship read
  clearly (interior joinery, façade detailing, lighting design), not just
  wide establishing shots.

## selected-work/
The "Selected Work" grid further down the homepage. Unlike the two folders
above, this one is organized **one subfolder per project**, and each
subfolder's name must exactly match that project's slug — the same slug
used in its URL (e.g. `/projects/khiran-chalet-kuwait` → folder name
`khiran-chalet-kuwait`).

- **To feature a project:** create a subfolder named after its slug and
  drop in one or more images.
- **To remove a project from the homepage:** delete its subfolder (or move
  it out of `selected-work/`).
- **To reorder the grid:** prefix folder names with a number, e.g.
  `01-khiran-chalet-kuwait`, `02-aurea-social-house-new-capital-egypt` —
  the number is stripped when matching the project, so it only affects
  display order.
- **If a subfolder has multiple images**, the first one (alphabetically) is
  the one shown on the card. The rest just sit there as ready alternates —
  rename your preferred one to start with `01-` to promote it, or delete
  the ones you don't want, without touching any other file.
- **If a subfolder's name doesn't match a real project slug**, it's
  skipped silently — it won't break the page, it just won't show up. Check
  the slug in `packages/ui-components/src/data/projects.ts` if a project
  isn't appearing.
- Project title, sector, city, market, and status (e.g. "Under
  Construction") are always pulled live from that project's real data —
  you only ever choose the image, never re-type the facts.

## A note on image optimization
You don't need to pre-compress or resize anything before dropping files in
here. Every image in this folder is served through the site's existing
Next.js image pipeline (the same one used everywhere else on the site),
which automatically resizes, compresses, and converts to modern formats
per device at request time. Just use good source quality — the pipeline
handles the rest.

## Currently curated (as of this setup)
- `hero/` — Khiran Chalet, Beit Al Watan, Surra Villa, AUREA Social House
- `precision/` — Beit Al Watan (2 render angles), Al Nozha Private Villa
- `selected-work/` — Khiran Chalet, Al Nozha Private Villa, Beit Al Watan,
  AUREA Social House, Sultan Center Hawally, Surra Villa

These were chosen to balance the disciplines AHW wants represented
(Architecture, Design & Build, Interior Design, Interior Fit-Out,
Construction, Smart Buildings) using the strongest available real
photography at the time. Swap any of them freely — this list is a
starting point, not a fixed set.
