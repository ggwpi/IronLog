import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Raw Git blobs from e4a68a94c42a3c17cbd560d66ce2e46a7048ab99. Boundary shims are separate.
const sources = [
  ["measurements.test.js","6b72150f668b4cb161935fe06750d2a4b275a71c"],
  ["weigh-ins.test.js","254dbb97f6970382f573a5a770b4badc01584e2e"],
  [
    "export-csv.js",
    "89cc45a3b8bee4c19edad47a9c23d40bb823ed6a"
  ],
  [
    "import-csv.js",
    "f1eb8d1b4b4086edc7fb8c567721a7fc8fc9dc8c"
  ],
  [
    "weigh-ins.js",
    "5b3915751afc6c9f019c200f0025ba8e4eb70820"
  ],
  [
    "tempo.js",
    "9a5b0a6f67f78c18d849303667558bf27c1e2aad"
  ],
  [
    "bands.js",
    "02173ef70282063dd22bb3c89b3cbc1a32df4278"
  ],
  [
    "measurements.js",
    "8964c4ac370e6a5d652e86a7de18cfdb22e6e410"
  ],
  [
    "workout-model.js",
    "2988d09b2701b8770056f146c2ab174cfaaff9bd"
  ],
  [
    "incline.js",
    "d189d4da57d58d0f429d14d3067efe5b0fa42794"
  ],
  [
    "set-notes.js",
    "b92d958b321d95f081cc270e3f3e3afe826c6bd9"
  ],
  [
    "import-choices.js",
    "2d5d6fed2aca52ffa0a55545c7f7b61e8f62bbfe"
  ],
  [
    "activities.js",
    "b1819079264f1732f8d008e0f6af611b1548c96c"
  ],
  [
    "exercise-aliases.js",
    "0588caa6425f9af22e788d89f36e7da38f80857a"
  ],
  [
    "export-csv.test.js",
    "91e5d9e8a3007868e5ab0bf558eb8e5b50bd698b"
  ],
  [
    "set-tags.test.js",
    "2942b4c480865adce51479f433e7bb36cda2bf48"
  ],
  [
    "tempo.test.js",
    "138c3c5e0afa91b7a1248ecc2b2d29df2bbd6e16"
  ],
  [
    "bands.test.js",
    "2f1f6beb0a14fe6acb082ca2a6ac811464bac4b4"
  ]
]
describe('immutable original CSV dependency closure', () => {
  it.each(sources)('%s is unchanged from pinned openGym', (name, expected) => {
    const bytes = readFileSync(new URL('./opengym-v145/' + name, import.meta.url))
    expect(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')).toBe(expected)
  })
})
