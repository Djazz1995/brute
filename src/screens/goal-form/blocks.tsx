/** Goal-form field blocks. Each is self-contained; the screen renders the ones
 *  a goal type's descriptor lists (config.ts). Schedule/Measure are controlled
 *  over the saved value, so prefill-on-edit just flows through props. */

import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { MonthCalendar } from '@/components/month-calendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useBuddies } from '@/hooks/use-buddies';
import { useCollections } from '@/hooks/use-collections';
import type {
  EscalationSpeed,
  GoalCategory,
  RudenessLevel,
  Schedule,
  ScheduleSlot,
} from '@/models';
import { collectionService } from '@/services/collectionService';

import {
  CategoryConfig,
  LABEL_OPTIONS,
  RUDENESS,
  SPEEDS,
  WEEKDAYS,
  dateToTime,
  slotKey,
  slotText,
  timeToDate,
} from './config';
import { Chip, ChipRow, Field, fieldStyles as s, useInputStyle } from './fields';

const ERROR = '#E5484D';

// ── Cue ──────────────────────────────────────────────────────────────────
export function CueBlock({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const theme = useTheme();
  const inputStyle = useInputStyle();
  return (
    <Field label="Cue (optional)">
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? 'bag by the door'}
        placeholderTextColor={theme.textSecondary}
        style={inputStyle}
      />
    </Field>
  );
}

// ── Blockers ─────────────────────────────────────────────────────────────
export function BlockersBlock({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const theme = useTheme();
  const inputStyle = useInputStyle();
  const [draft, setDraft] = useState('');

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setDraft('');
  }

  return (
    <Field label="What usually stops you? (optional)">
      <ThemedText type="small" themeColor="textSecondary">
        Your go-to excuses. We’ll throw them back at you — the excuse, never you.
      </ThemedText>
      <View style={s.entryRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          placeholder="too tired"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="done"
          style={[inputStyle, { flex: 1 }]}
        />
        <Button title="Add" variant="secondary" onPress={add} style={s.addBtn} />
      </View>
      {value.length > 0 ? (
        <View style={s.chips}>
          {value.map((b) => (
            <Pressable key={b} onPress={() => onChange(value.filter((x) => x !== b))}>
              <ThemedView type="backgroundSelected" style={s.chip}>
                <ThemedText type="small">{b} ✕</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Field>
  );
}

// ── Schedule ─────────────────────────────────────────────────────────────
export function ScheduleBlock({
  value,
  onChange,
  category,
  defaults,
}: {
  value: Schedule;
  onChange: (s: Schedule) => void;
  category: GoalCategory;
  defaults: CategoryConfig;
}) {
  const mode: 'fixed' | 'weekly' | 'dates' = value.dates
    ? 'dates'
    : value.weeklyTarget != null
      ? 'weekly'
      : 'fixed';
  const slots = value.slots;
  const labelOptions = LABEL_OPTIONS[category];
  const datesTime = value.time ?? defaults.defaultTime ?? '09:00';

  // Day chips start at today and wrap (today → +6 days), so the picker reads
  // forward instead of always Mon-first. ISO weekday: 1 = Mon … 7 = Sun.
  const todayIso = ((new Date().getDay() + 6) % 7) + 1;
  const dayOrder = Array.from({ length: 7 }, (_, k) => ((todayIso - 1 + k) % 7) + 1);

  // Ephemeral builder state (which slot is being composed) — not persisted.
  const [builderDays, setBuilderDays] = useState<number[]>(defaults.defaultDays ?? [1, 3, 5]);
  const [builderTime, setBuilderTime] = useState(
    labelOptions?.[0].time ?? defaults.defaultTime ?? '07:00'
  );
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>(labelOptions?.[0].label);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeDraft, setTimeDraft] = useState<Date>(() => timeToDate(builderTime));
  // Separate picker for the shared "specific dates" reminder time.
  const [showDatesTime, setShowDatesTime] = useState(false);
  const [datesTimeDraft, setDatesTimeDraft] = useState<Date>(() => timeToDate(datesTime));
  const [error, setError] = useState<string>();

  function setMode(next: 'fixed' | 'weekly' | 'dates') {
    // Each mode is exclusive — clear the others' fields.
    if (next === 'weekly') onChange({ slots: [], weeklyTarget: defaults.weeklyTarget ?? 3 });
    else if (next === 'dates') onChange({ slots: [], dates: [], time: defaults.defaultTime ?? '09:00' });
    else onChange({ slots });
  }

  function setWeekly(n: number) {
    onChange({ slots: [], weeklyTarget: n });
  }

  function toggleDate(date: string) {
    const cur = value.dates ?? [];
    const next = cur.includes(date) ? cur.filter((d) => d !== date) : [...cur, date].sort();
    onChange({ slots: [], dates: next, time: datesTime });
  }

  function toggleBuilderDay(d: number) {
    setBuilderDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));
  }

  function addSlots() {
    if (builderDays.length === 0) {
      setError('Pick at least one day first.');
      return;
    }
    setError(undefined);
    const next = [...slots];
    for (const day of builderDays) {
      const slot: ScheduleSlot = selectedLabel
        ? { day, time: builderTime, label: selectedLabel }
        : { day, time: builderTime };
      if (!next.some((x) => slotKey(x) === slotKey(slot))) next.push(slot);
    }
    next.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
    onChange({ slots: next });
  }

  function removeSlot(slot: ScheduleSlot) {
    const next = slots.filter((x) => slotKey(x) !== slotKey(slot));
    onChange({ slots: next });
  }

  // The day/time builder is fixed-schedule only; weekly is a pure day count.
  const showBuilder = mode === 'fixed';

  return (
    <Field label="Schedule">
      <View style={s.chips}>
        <Chip text="Specific days & times" active={mode === 'fixed'} onPress={() => setMode('fixed')} />
        <Chip text="X days a week" active={mode === 'weekly'} onPress={() => setMode('weekly')} />
        <Chip text="Specific dates" active={mode === 'dates'} onPress={() => setMode('dates')} />
      </View>

      {mode === 'dates' ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Pick the exact dates, any time you like. Each date is its own check-off.
          </ThemedText>
          <MonthCalendar selected={value.dates ?? []} onToggle={toggleDate} minDate={new Date()} />
          <View style={s.entryRow}>
            <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
              {(value.dates ?? []).length} date{(value.dates ?? []).length === 1 ? '' : 's'} · reminder at
            </ThemedText>
            <Pressable
              onPress={() => {
                setDatesTimeDraft(timeToDate(datesTime));
                setShowDatesTime(true);
              }}
            >
              <ThemedView type="backgroundElement" style={[s.input, s.timeBox]}>
                <ThemedText type="default">{datesTime}</ThemedText>
              </ThemedView>
            </Pressable>
          </View>
          {Platform.OS === 'ios' ? (
            <Modal visible={showDatesTime} transparent animationType="slide">
              <Pressable style={s.modalBackdrop} onPress={() => setShowDatesTime(false)}>
                <Pressable>
                  <ThemedView style={s.modalSheet}>
                    <View style={s.modalHeader}>
                      <Pressable onPress={() => setShowDatesTime(false)}>
                        <ThemedText type="link" themeColor="textSecondary">
                          Cancel
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          onChange({ slots: [], dates: value.dates ?? [], time: dateToTime(datesTimeDraft) });
                          setShowDatesTime(false);
                        }}
                      >
                        <ThemedText type="linkPrimary">Done</ThemedText>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={datesTimeDraft}
                      mode="time"
                      display="spinner"
                      onChange={(_, date) => date && setDatesTimeDraft(date)}
                    />
                  </ThemedView>
                </Pressable>
              </Pressable>
            </Modal>
          ) : showDatesTime ? (
            <DateTimePicker
              value={datesTimeDraft}
              mode="time"
              is24Hour
              display="default"
              onChange={(event, date) => {
                setShowDatesTime(false);
                if (event.type === 'set' && date)
                  onChange({ slots: [], dates: value.dates ?? [], time: dateToTime(date) });
              }}
            />
          ) : null}
        </>
      ) : null}

      {mode === 'weekly' ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Hit it this many days a week, any day. The streak counts weekly hits.
          </ThemedText>
          <View style={s.chips}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Chip
                key={n}
                text={String(n)}
                active={value.weeklyTarget === n}
                onPress={() => setWeekly(n)}
              />
            ))}
          </View>
        </>
      ) : null}

      {showBuilder ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {labelOptions
              ? 'Pick days, choose a type and time, then Add. Add only the ones you want.'
              : 'Pick days and a time, then Add. Add more for extra times.'}
          </ThemedText>

          <View style={s.chips}>
            {dayOrder.map((iso) => (
              <Chip
                key={iso}
                text={WEEKDAYS[iso - 1]}
                active={builderDays.includes(iso)}
                onPress={() => toggleBuilderDay(iso)}
              />
            ))}
          </View>

          {labelOptions ? (
            <View style={s.chips}>
              {labelOptions.map((opt) => (
                <Chip
                  key={opt.label}
                  text={opt.label}
                  active={selectedLabel === opt.label}
                  onPress={() => {
                    setSelectedLabel(opt.label);
                    setBuilderTime(opt.time);
                  }}
                />
              ))}
            </View>
          ) : null}

          <View style={s.entryRow}>
            <Pressable
              onPress={() => {
                setTimeDraft(timeToDate(builderTime));
                setShowTimePicker(true);
              }}
              style={{ flex: 1 }}
            >
              <ThemedView type="backgroundElement" style={[s.input, s.timeBox]}>
                <ThemedText type="default">{builderTime}</ThemedText>
              </ThemedView>
            </Pressable>
            <Button title="Add" variant="secondary" onPress={addSlots} style={s.addBtn} />
          </View>

          {error ? (
            <ThemedText type="small" style={{ color: ERROR }}>
              {error}
            </ThemedText>
          ) : null}

          {slots.length > 0 ? (
            <View style={s.chips}>
              {slots.map((slot) => (
                <Pressable key={slotKey(slot)} onPress={() => removeSlot(slot)}>
                  <ThemedView type="backgroundSelected" style={s.chip}>
                    <ThemedText type="small">{slotText(slot)} ✕</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              No reminders yet.
            </ThemedText>
          )}

          {Platform.OS === 'ios' ? (
            <Modal visible={showTimePicker} transparent animationType="slide">
              <Pressable style={s.modalBackdrop} onPress={() => setShowTimePicker(false)}>
                <Pressable>
                  <ThemedView style={s.modalSheet}>
                    <View style={s.modalHeader}>
                      <Pressable onPress={() => setShowTimePicker(false)}>
                        <ThemedText type="link" themeColor="textSecondary">
                          Cancel
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setBuilderTime(dateToTime(timeDraft));
                          setShowTimePicker(false);
                        }}
                      >
                        <ThemedText type="linkPrimary">Done</ThemedText>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={timeDraft}
                      mode="time"
                      display="spinner"
                      onChange={(_, date) => date && setTimeDraft(date)}
                    />
                  </ThemedView>
                </Pressable>
              </Pressable>
            </Modal>
          ) : showTimePicker ? (
            <DateTimePicker
              value={timeDraft}
              mode="time"
              is24Hour
              display="default"
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (event.type === 'set' && date) setBuilderTime(dateToTime(date));
              }}
            />
          ) : null}
        </>
      ) : null}
    </Field>
  );
}

// ── Measure (quantified target) ──────────────────────────────────────────
export type MeasureValue = { enabled: boolean; target: string; unit: string };

export function MeasureBlock({
  value,
  onChange,
}: {
  value: MeasureValue;
  onChange: (v: MeasureValue) => void;
}) {
  const theme = useTheme();
  const inputStyle = useInputStyle();
  return (
    <Field label="Track a number? (optional)">
      <View style={s.chips}>
        <Chip
          text="No — just done/skip"
          active={!value.enabled}
          onPress={() => onChange({ ...value, enabled: false })}
        />
        <Chip
          text="Yes — track an amount"
          active={value.enabled}
          onPress={() => onChange({ ...value, enabled: true })}
        />
      </View>
      {value.enabled ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Goal each time, e.g. 20 pages / 2 L. You’ll log how much when you mark it done.
          </ThemedText>
          <View style={s.entryRow}>
            <TextInput
              value={value.target}
              onChangeText={(t) => onChange({ ...value, target: t })}
              placeholder="20"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              style={[inputStyle, { flex: 1 }]}
            />
            <TextInput
              value={value.unit}
              onChangeText={(u) => onChange({ ...value, unit: u })}
              placeholder="pages"
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, { flex: 1 }]}
            />
          </View>
        </>
      ) : null}
    </Field>
  );
}

// ── Rudeness / Escalation ────────────────────────────────────────────────
export function RudenessBlock({
  value,
  onChange,
}: {
  value: RudenessLevel;
  onChange: (v: RudenessLevel) => void;
}) {
  return (
    <Field label="Rudeness">
      <ChipRow options={RUDENESS} selected={value} onSelect={onChange} label={(r) => String(r)} />
    </Field>
  );
}

export function EscalationBlock({
  value,
  onChange,
}: {
  value: EscalationSpeed;
  onChange: (v: EscalationSpeed) => void;
}) {
  return (
    <Field label="Escalation speed">
      <ChipRow options={SPEEDS} selected={value} onSelect={onChange} label={(sp) => sp} />
    </Field>
  );
}

// ── Buddy ────────────────────────────────────────────────────────────────
export function BuddyBlock({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const { data: buddies } = useBuddies();
  return (
    <Field label="Accountability buddy (optional)">
      {buddies.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No buddies yet — add one in Settings.
        </ThemedText>
      ) : (
        <View style={s.chips}>
          <Chip text="None" active={!value} onPress={() => onChange(undefined)} />
          {buddies.map((b) => (
            <Chip
              key={b.id}
              text={b.contact}
              active={value === b.id}
              onPress={() => onChange(b.id)}
            />
          ))}
        </View>
      )}
    </Field>
  );
}

// ── Collection ───────────────────────────────────────────────────────────
export function CollectionBlock({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const theme = useTheme();
  const inputStyle = useInputStyle();
  const { data: collections, refetch } = useCollections();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string>();

  async function add() {
    const v = draft.trim();
    if (!v) return;
    setError(undefined);
    try {
      const created = await collectionService.create(v);
      setDraft('');
      await refetch();
      onChange(created.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Field label="Collection (optional)">
      <ThemedText type="small" themeColor="textSecondary">
        Group goals under a bigger ambition, e.g. “Run a marathon”.
      </ThemedText>
      <View style={s.chips}>
        <Chip text="None" active={!value} onPress={() => onChange(undefined)} />
        {collections.map((c) => (
          <Chip key={c.id} text={c.name} active={value === c.id} onPress={() => onChange(c.id)} />
        ))}
      </View>
      <View style={s.entryRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          placeholder="New collection"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="done"
          style={[inputStyle, { flex: 1 }]}
        />
        <Button title="Add" variant="secondary" onPress={add} style={s.addBtn} />
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: ERROR }}>
          {error}
        </ThemedText>
      ) : null}
    </Field>
  );
}
