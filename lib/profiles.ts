"use client";

/**
 * Several children share one tablet, so progress is keyed by profile. Profiles
 * are names on a device and nothing more: no accounts, no passwords, nothing
 * leaves the browser.
 *
 * The first profile deliberately keeps the original storage key, so a device
 * that was used before profiles existed carries its XP and streak over without
 * a migration step.
 */

export interface Profile {
  id: string;
  name: string;
}

export interface Profiles {
  version: 1;
  profiles: Profile[];
  activeId: string;
}

const STORAGE_KEY = "learn-afaan-oromo:profiles:v1";
export const FIRST_PROFILE_ID = "default";
export const MAX_PROFILES = 6;

const defaults = (): Profiles => ({
  version: 1,
  profiles: [{ id: FIRST_PROFILE_ID, name: "Learner" }],
  activeId: FIRST_PROFILE_ID,
});

function write(profiles: Profiles): Profiles {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }
  return profiles;
}

export function loadProfiles(): Profiles {
  if (typeof window === "undefined") return defaults();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) return defaults();
  try {
    const parsed = JSON.parse(stored) as Profiles;
    const [first] = parsed.profiles ?? [];
    if (parsed.version !== 1 || first === undefined) return defaults();
    const activeId = parsed.profiles.some((profile) => profile.id === parsed.activeId)
      ? parsed.activeId
      : first.id;
    return { version: 1, profiles: parsed.profiles, activeId };
  } catch {
    return defaults();
  }
}

export function activeProfileId(): string {
  return loadProfiles().activeId;
}

export function setActiveProfile(id: string): Profiles {
  const current = loadProfiles();
  if (!current.profiles.some((profile) => profile.id === id)) return current;
  return write({ ...current, activeId: id });
}

/** Adds a profile and switches to it. Returns the list unchanged when full. */
export function addProfile(name: string, now = Date.now()): Profiles {
  const current = loadProfiles();
  const trimmed = name.trim();
  if (trimmed === "" || current.profiles.length >= MAX_PROFILES) return current;
  const id = `p-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return write({
    version: 1,
    profiles: [...current.profiles, { id, name: trimmed }],
    activeId: id,
  });
}

export function renameProfile(id: string, name: string): Profiles {
  const current = loadProfiles();
  const trimmed = name.trim();
  if (trimmed === "") return current;
  return write({
    ...current,
    profiles: current.profiles.map((profile) =>
      profile.id === id ? { ...profile, name: trimmed } : profile,
    ),
  });
}

/**
 * Removes a profile and its progress. The last profile cannot be removed —
 * there would be nobody to practise as.
 */
export function removeProfile(id: string): Profiles {
  const current = loadProfiles();
  if (current.profiles.length <= 1) return current;
  const profiles = current.profiles.filter((profile) => profile.id !== id);
  const [first] = profiles;
  if (first === undefined) return current;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(progressKey(id));
  }
  return write({
    version: 1,
    profiles,
    activeId: current.activeId === id ? first.id : current.activeId,
  });
}

export function progressKey(profileId: string): string {
  const base = "learn-afaan-oromo:progress:v1";
  return profileId === FIRST_PROFILE_ID ? base : `${base}:${profileId}`;
}
