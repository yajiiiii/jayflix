import type { NormalizedContent } from "@/services/content";

export function mergeUniqueContent(
  ...groups: NormalizedContent[][]
): NormalizedContent[] {
  const seen = new Set<string>();
  const merged: NormalizedContent[] = [];

  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.id)) {
        continue;
      }

      seen.add(item.id);
      merged.push(item);
    }
  }

  return merged;
}

export function pickHeroItems(
  ...groups: NormalizedContent[][]
): NormalizedContent[] {
  const heroReadyGroups = groups.map((group) =>
    group.filter((item) => Boolean((item.backdrop || item.poster) && item.overview))
  );
  const seen = new Set<string>();
  const selected: NormalizedContent[] = [];
  const maxLength = Math.max(0, ...heroReadyGroups.map((group) => group.length));

  for (let index = 0; index < maxLength && selected.length < 6; index += 1) {
    for (const group of heroReadyGroups) {
      const item = group[index];

      if (!item || seen.has(item.id)) {
        continue;
      }

      seen.add(item.id);
      selected.push(item);

      if (selected.length === 6) {
        return selected;
      }
    }
  }

  for (const item of mergeUniqueContent(...groups)) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    selected.push(item);

    if (selected.length === 6) {
      break;
    }
  }

  return selected;
}

export function interleaveContentRows(
  first: NormalizedContent[],
  second: NormalizedContent[]
): NormalizedContent[] {
  const merged: NormalizedContent[] = [];
  const seen = new Set<string>();
  const maxLength = Math.max(first.length, second.length);

  for (let index = 0; index < maxLength; index += 1) {
    for (const item of [first[index], second[index]]) {
      if (!item || seen.has(item.id)) {
        continue;
      }

      seen.add(item.id);
      merged.push(item);
    }
  }

  return merged;
}
