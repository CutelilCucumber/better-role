import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import { EMPTY_STATE, ATTR_MAP } from "./constants";
import { loadState, saveState } from "./utils/storage";
import { activityStats, uid } from "./utils/helpers";

import { TopNav, Toast } from "./components";
import { MapScreen, ActivitiesScreen, ActivityDetail, CharacterScreen } from "./pages";
import { NewActivityModal, RecordSessionModal, PersonalBestToast } from "./modals";

function AppRoutes({ state, showNewActivity, setShowNewActivity, createActivityMode, setCreateActivityMode, createPrefill, setCreatePrefill, recordingActivity, setRecordingActivity, editingSession, setEditingSession, onSubmitCreate, onRecordAgain, onUpdateSession, onDeleteSession, onBackFromCreate, onPickFromLibrary, onPickExisting }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isMapRoute = location.pathname === "/";
  const isActivitiesRoute = location.pathname === "/activities";
  const isActivityDetailRoute = location.pathname.startsWith("/activities/");
  const isCharacterRoute = location.pathname === "/character";

  return (
    <Routes>
      <Route path="/" element={
        <MapScreen
          state={state}
          onOpenNew={() => setShowNewActivity(true)}
          onOpenActivity={(activity) => navigate(`/activities/${activity.id}`)}
        />
      } />
      <Route path="/activities" element={
        <ActivitiesScreen
          state={state}
          onRecordAgain={onRecordAgain}
          onUpdateSession={onUpdateSession}
          onDeleteSession={onDeleteSession}
        />
      } />
      <Route path="/activities/:activityId" element={
        <ActivityDetail
          activity={state.activities.find((a) => a.id === location.pathname.split("/")[2])}
          state={state}
          onBack={() => navigate(-1)}
          onRecordAgain={onRecordAgain}
          onUpdateSession={onUpdateSession}
          onDeleteSession={onDeleteSession}
          backLabel={isMapRoute ? "Map" : "Activities"}
        />
      } />
      <Route path="/character" element={<CharacterScreen state={state} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [state, setState] = useState(null);
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [createActivityMode, setCreateActivityMode] = useState(false);
  const [createPrefill, setCreatePrefill] = useState(null);
  const [recordingActivity, setRecordingActivity] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
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
      primaryAttribute: data.primaryAttribute,
      secondaryAttribute: data.secondaryAttribute,
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

  const updateSession = (activity, sessionId, data) => {
    const oldSession = state.sessions.find((s) => s.id === sessionId);
    if (!oldSession) return;

    const allActivitySessions = state.sessions.filter((s) => s.activityId === activity.id);
    const otherSessions = allActivitySessions.filter((s) => s.id !== sessionId);

    const oldPrimaryAttr = oldSession.primaryAttribute;
    const oldSecondaryAttr = oldSession.secondaryAttribute;

    const newPrimaryAttr = data.primaryAttribute;
    const newSecondaryAttr = data.secondaryAttribute;

    const stats = activityStats(activity, otherSessions);
    const bests = [];
    if (data.quantity && data.quantity > stats.bestQuantity) {
      bests.push({ label: "Quantity", value: data.quantity, prev: stats.bestQuantity });
    }
    if (data.duration && data.duration > stats.bestDuration) {
      bests.push({ label: "Duration", value: data.duration, prev: stats.bestDuration });
    }

    const updatedSession = {
      ...oldSession,
      date: oldSession.date,
      duration: Number(data.duration) || 0,
      quantity: Number(data.quantity) || 0,
      intensity: Number(data.intensity) || 0,
      notes: data.notes || "",
      primaryAttribute: newPrimaryAttr,
      secondaryAttribute: newSecondaryAttr,
      personalBests: bests.map((b) => b.label),
    };

    setState((s) => {
      const newAttributes = { ...s.attributes };

      if (oldPrimaryAttr) {
        newAttributes[oldPrimaryAttr] = (newAttributes[oldPrimaryAttr] || 0) - 1;
      }
      if (oldSecondaryAttr) {
        newAttributes[oldSecondaryAttr] = (newAttributes[oldSecondaryAttr] || 0) - 0.5;
      }

      newAttributes[newPrimaryAttr] = (newAttributes[newPrimaryAttr] || 0) + 1;
      if (newSecondaryAttr) {
        newAttributes[newSecondaryAttr] = (newAttributes[newSecondaryAttr] || 0) + 0.5;
      }

      const updatedActivities = s.activities.map((a) =>
        a.id === activity.id
          ? { ...a, attribute: newPrimaryAttr, secondaryAttribute: newSecondaryAttr }
          : a
      );

      return {
        ...s,
        sessions: s.sessions.map((ses) => (ses.id === sessionId ? updatedSession : ses)),
        attributes: newAttributes,
        activities: updatedActivities,
      };
    });

    setEditingSession(null);
    setShowNewActivity(false);

    const primaryMeta = ATTR_MAP[newPrimaryAttr];
    showToast(`Updated (+1 ${primaryMeta.label})`);
    if (bests.length && stats.sessionCount > 0) {
      setTimeout(() => setPb({ activity, bests }), 400);
    }
  };

  const deleteSession = (activity, sessionId) => {
    const sessionToDelete = state.sessions.find((s) => s.id === sessionId);
    if (!sessionToDelete) return;

    const primaryAttr = sessionToDelete.primaryAttribute;
    const secondaryAttr = sessionToDelete.secondaryAttribute;

    setState((s) => {
      const newAttributes = { ...s.attributes };
      if (primaryAttr) {
        newAttributes[primaryAttr] = (newAttributes[primaryAttr] || 0) - 1;
      }
      if (secondaryAttr) {
        newAttributes[secondaryAttr] = (newAttributes[secondaryAttr] || 0) - 0.5;
      }

      return {
        ...s,
        sessions: s.sessions.filter((ses) => ses.id !== sessionId),
        attributes: newAttributes,
      };
    });

    showToast("Session deleted");
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
      <TopNav />

      <div className="flex-1 overflow-y-auto pt-16">
        <AppRoutes
          state={state}
          showNewActivity={showNewActivity}
          setShowNewActivity={setShowNewActivity}
          createActivityMode={createActivityMode}
          setCreateActivityMode={setCreateActivityMode}
          createPrefill={createPrefill}
          setCreatePrefill={setCreatePrefill}
          recordingActivity={recordingActivity}
          setRecordingActivity={setRecordingActivity}
          editingSession={editingSession}
          setEditingSession={setEditingSession}
          onSubmitCreate={createActivity}
          onRecordAgain={recordSession}
          onUpdateSession={updateSession}
          onDeleteSession={deleteSession}
          onBackFromCreate={() => {
            setCreateActivityMode(false);
            setCreatePrefill(null);
          }}
          onPickFromLibrary={(seedItem) => {
            setCreatePrefill(seedItem);
            setCreateActivityMode(true);
          }}
          onPickExisting={(a) => {
            setShowNewActivity(false);
            setRecordingActivity(a);
          }}
        />
      </div>

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

      {editingSession && (
        <RecordSessionModal
          activity={state.activities.find((a) => a.id === editingSession.activityId)}
          onClose={() => setEditingSession(null)}
          onBack={() => setEditingSession(null)}
          onSubmit={(data) => updateSession(state.activities.find((a) => a.id === editingSession.activityId), editingSession.id, data)}
          editingSession={editingSession}
        />
      )}

      {pb && <PersonalBestToast pb={pb} onClose={() => setPb(null)} />}

      <Toast message={toast} />
    </div>
  );
}