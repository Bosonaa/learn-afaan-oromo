"use client";

import { useState } from "react";
import {
  MAX_PROFILES,
  addProfile,
  removeProfile,
  renameProfile,
  setActiveProfile,
  type Profiles,
} from "@/lib/profiles";

/**
 * Who is practising. Kept on the unit list rather than the header so a lesson
 * in progress can never have the learner switched underneath it.
 */
export function ProfileSwitcher({
  profiles,
  onChange,
}: {
  profiles: Profiles;
  onChange: (next: Profiles) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [name, setName] = useState("");

  const active = profiles.profiles.find((profile) => profile.id === profiles.activeId);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wide text-slate-500">Who is learning</span>
        {profiles.profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onChange(setActiveProfile(profile.id))}
            aria-pressed={profile.id === profiles.activeId}
            className={
              profile.id === profiles.activeId
                ? "rounded-full bg-teal-600 px-3 py-1 text-sm font-semibold text-white"
                : "rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200"
            }
          >
            {profile.name}
          </button>
        ))}

        {profiles.profiles.length < MAX_PROFILES && !adding ? (
          <button
            type="button"
            onClick={() => {
              setName("");
              setAdding(true);
            }}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-500 hover:border-slate-400"
          >
            + Add child
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setManaging((current) => !current)}
          className="ml-auto text-xs text-slate-400 hover:text-slate-600"
        >
          {managing ? "Done" : "Manage"}
        </button>
      </div>

      {adding ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onChange(addProfile(name));
            setAdding(false);
            setName("");
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="First name"
            maxLength={20}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white">
            Add
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold"
          >
            Cancel
          </button>
        </form>
      ) : null}

      {managing && active !== undefined ? (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <label className="block text-xs uppercase tracking-wide text-slate-500" htmlFor="profile-name">
            Rename {active.name}
          </label>
          <div className="flex gap-2">
            <input
              id="profile-name"
              defaultValue={active.name}
              maxLength={20}
              onBlur={(event) => onChange(renameProfile(active.id, event.target.value))}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {profiles.profiles.length > 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete ${active.name} and their progress on this device?`)) {
                    onChange(removeProfile(active.id));
                    setManaging(false);
                  }
                }}
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
              >
                Delete
              </button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">
            Profiles are just names on this device — each keeps its own XP, streak and review
            schedule, and nothing is uploaded.
          </p>
        </div>
      ) : null}
    </div>
  );
}
