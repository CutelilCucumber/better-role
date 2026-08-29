import React, { useState, useEffect, useCallback } from "react";

import { EMPTY_STATE, ATTR_MAP } from "./constants";
import { loadState, saveState } from "./utils/storage";
import { activityStats, uid } from "./utils/helpers";

import { BottomNav, Toast } from "./components";
import { MapScreen, ActivitiesScreen, CharacterScreen } from "./pages";
import { NewActivityModal, RecordSessionModal, PersonalBestToast } from "./modals";

export default function App() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("map");
  const [view, setView] = useState({ name: "list" }); // routing within Activities tab
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [createActivityMode, setCreateActivityMode] = useState(false);
  const [createPrefill, setCreatePrefill] = useState(null);
  const [recordingActivity, setRecordingActivity] = useState(null);
  const [toast, setToast] = useState(null);
  const [pb, setPb] = useState(null);

  useEffect(() => {
    (async () => {
      const loaded = await loadState();
      setState(loaded || EMPTY_STATE);
    })();
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const createActivity = (data) => {
    const activity = {
      id: uid("activity"),
      name: data.name.trim(),
      attribute: "constitution",
      secondaryAttribute: data.secondaryAttribute || null,
      createdAt: new Date().toISOString(),
      unit: data.unit || "",
      tracking: { duration: true, quantity: !!data.unit, intensity: true },
    };
    setState((s) => ({ ...s, activities: [...s.activities, activity] }));
    setCreateActivityMode(false);
    setCreatePrefill(null);
    setShowNewActivity(false);
    setRecordingActivity(activity);
  };

  const recordSession = (activity, data) => {
    const stats = activityStats(activity, state.sessions);
    const bests = [];
    if (data.quantity && data.quantity > stats.bestQuantity) {
      bests.push({ label: "Quantity", value: data.quantity, prev: stats.bestQuantity });
    }
    if (data.duration && data.duration > stats.bestDuration) {
      bests.push({ label: "Duration", value: data.duration, prev: stats.bestDuration });
    }

    const session = {
      id: uid("session"),
      activityId: activity.id,
      date: new Date().toISOString(),
      duration: Number(data.duration) || 0,
      quantity: Number(data.quantity) || 0,
      intensity: Number(data.intensity) || 0,
      notes: data.notes || "",
      personalBests: bests.map((b) => b.label),
    };

    const primaryAttr = data.primaryAttribute;
    const secondaryAttr = data.secondaryAttribute;

    setState((s) => {
      const newAttributes = { ...s.attributes };
      newAttributes[primaryAttr] = (newAttributes[primaryAttr] || 0) + 1;
      if (secondaryAttr) {
        newAttributes[secondaryAttr] = (newAttributes[secondaryAttr] || 0) + 0.5;
      }

      const updatedActivities = s.activities.map((a) =>
        a.id === activity.id
          ? { ...a, attribute: primaryAttr, secondaryAttribute: secondaryAttr }
          : a
      );

      return {
        ...s,
        sessions: [...s.sessions, session],
        attributes: newAttributes,
        activities: updatedActivities,
      };
    });

    setRecordingActivity(null);
    setShowNewActivity(false);

    const primaryMeta = ATTR_MAP[primaryAttr];
    showToast(`+1 ${primaryMeta.label}`);
    if (bests.length && stats.sessionCount > 0) {
      setTimeout(() => setPb({ activity, bests }), 400);
    }
  };

  if (!state) {
    return (
      <div className="w-full h-full min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-500 text-sm">
        Loading your character…
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen bg-neutral-950 text-neutral-100 flex flex-col"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div className="flex-1 overflow-y-auto pb-20">
        {tab === "map" && (
          <MapScreen
            state={state}
            onOpenNew={() => setShowNewActivity(true)}
            onOpenActivity={(activity) => {
              setTab("activities");
              setView({ name: "detail", activityId: activity.id });
            }}
          />
        )}
        {tab === "activities" && (
          <ActivitiesScreen
            state={state}
            view={view}
            setView={setView}
            onRecordAgain={(activity) => setRecordingActivity(activity)}
          />
        )}
        {tab === "character" && <CharacterScreen state={state} />}
      </div>

      <BottomNav
        tab={tab}
        setTab={(t) => {
          setTab(t);
          setView({ name: "list" });
        }}
      />

      {showNewActivity && (
        <NewActivityModal
          activities={state.activities}
          sessions={state.sessions}
          onClose={() => {
            setShowNewActivity(false);
            setCreateActivityMode(false);
            setCreatePrefill(null);
          }}
          onPickExisting={(a) => {
            setShowNewActivity(false);
            setRecordingActivity(a);
          }}
          onCreateNew={(query) => {
            setCreatePrefill({ name: query });
            setCreateActivityMode(true);
          }}
          createMode={createActivityMode}
          createPrefill={createPrefill}
          onSubmitCreate={createActivity}
          onBackFromCreate={() => {
            setCreateActivityMode(false);
            setCreatePrefill(null);
          }}
          onPickFromLibrary={(seedItem) => {
            setCreatePrefill(seedItem);
            setCreateActivityMode(true);
          }}
        />
      )}

      {recordingActivity && (
        <RecordSessionModal
          activity={recordingActivity}
          onClose={() => setRecordingActivity(null)}
          onBack={() => {
            setRecordingActivity(null);
            setShowNewActivity(true);
          }}
          onSubmit={(data) => recordSession(recordingActivity, data)}
        />
      )}

      {pb && <PersonalBestToast pb={pb} onClose={() => setPb(null)} />}

      <Toast message={toast} />
    </div>
  );
}
