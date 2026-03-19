"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Schicht, SchichtTyp } from "@/lib/types";
import {
  calculateOvertime,
  calculateTotalMinutes,
  formatDuration,
  SHIFT_CONFIG,
} from "@/lib/shifts";

// --- German helpers ---

const GERMAN_MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const GERMAN_DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const SHIFT_TYPE_LABELS_FULL: Record<SchichtTyp, string> = {
  frueh: "Frühschicht",
  spaet: "Spätschicht",
  nacht: "Nachtschicht",
};

function formatDateGerman(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = GERMAN_DAYS[date.getDay()];
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${day}, ${d}.${m}.${y}`;
}

function formatMonthYear(date: Date): string {
  return `${GERMAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// --- Styles ---

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  // Header
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  headerName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  headerMeta: {
    fontSize: 10,
    color: "#444",
    marginBottom: 1,
  },
  headerSpacer: {
    marginBottom: 16,
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  shiftRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  orderRow: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingLeft: 8,
    backgroundColor: "#f5f5f5",
  },
  // Column widths
  colDatum: { width: "30%" },
  colTyp: { width: "25%" },
  colStunden: { width: "22%" },
  colUeberstunden: { width: "23%", textAlign: "right" },
  // Order columns
  colOrderNr: { width: "30%", paddingLeft: 8 },
  colOrderBeschreibung: { width: "40%" },
  colOrderZeit: { width: "30%", textAlign: "right" },
  // Summary
  summaryContainer: {
    marginTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: "#000",
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  summaryValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  // Signature
  signatureContainer: {
    marginTop: 40,
  },
  signatureLine: {
    fontSize: 10,
    color: "#333",
  },
});

// --- Component ---

export interface TimesheetDocumentProps {
  profile: { vorname: string; nachname: string; personalnummer: string };
  month: Date;
  shifts: Schicht[];
}

export function TimesheetDocument({
  profile,
  month,
  shifts,
}: TimesheetDocumentProps) {
  // Sort shifts by date ascending
  const sorted = [...shifts].sort((a, b) => a.datum.localeCompare(b.datum));

  // Calculate totals
  let totalMinutes = 0;
  let totalOvertimeMinutes = 0;

  for (const shift of sorted) {
    totalMinutes += calculateTotalMinutes(shift.auftraege, shift.schichttyp);
    totalOvertimeMinutes += calculateOvertime(
      shift.auftraege,
      shift.schichttyp
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.headerTitle}>Stundenzettel</Text>
        <Text style={styles.headerName}>
          {profile.vorname} {profile.nachname}
        </Text>
        <Text style={styles.headerMeta}>
          Personalnr.: {profile.personalnummer}
        </Text>
        <Text style={styles.headerMeta}>{formatMonthYear(month)}</Text>
        <View style={styles.headerSpacer} />

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDatum]}>Datum</Text>
          <Text style={[styles.tableHeaderText, styles.colTyp]}>
            Schichttyp
          </Text>
          <Text style={[styles.tableHeaderText, styles.colStunden]}>
            Reg. Stunden
          </Text>
          <Text style={[styles.tableHeaderText, styles.colUeberstunden]}>
            Überstunden
          </Text>
        </View>

        {/* Shift rows */}
        {sorted.map((shift) => {
          const shiftMinutes = calculateTotalMinutes(
            shift.auftraege,
            shift.schichttyp
          );
          const overtimeMinutes = calculateOvertime(
            shift.auftraege,
            shift.schichttyp
          );
          const regMinutes = SHIFT_CONFIG[shift.schichttyp].durationMinutes;

          return (
            <View key={shift.id} wrap={false}>
              {/* Main shift row */}
              <View style={styles.shiftRow}>
                <Text style={styles.colDatum}>
                  {formatDateGerman(shift.datum)}
                </Text>
                <Text style={styles.colTyp}>
                  {SHIFT_TYPE_LABELS_FULL[shift.schichttyp]}
                </Text>
                <Text style={styles.colStunden}>
                  {formatDuration(regMinutes)}
                </Text>
                <Text style={styles.colUeberstunden}>
                  {overtimeMinutes > 0
                    ? formatDuration(overtimeMinutes, true)
                    : "\u2014"}
                </Text>
              </View>

              {/* Order sub-rows */}
              {shift.auftraege.map((auftrag) => (
                <View key={auftrag.id} style={styles.orderRow}>
                  <Text style={[styles.colOrderNr, { fontSize: 8 }]}>
                    {auftrag.auftragsnummer}
                  </Text>
                  <Text style={[styles.colOrderBeschreibung, { fontSize: 8 }]}>
                    {auftrag.beschreibung ?? ""}
                  </Text>
                  <Text style={[styles.colOrderZeit, { fontSize: 8 }]}>
                    {auftrag.startzeit && auftrag.endzeit
                      ? `${auftrag.startzeit}\u2013${auftrag.endzeit}`
                      : ""}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gesamtstunden:</Text>
            <Text style={styles.summaryValue}>
              {formatDuration(totalMinutes)}
            </Text>
          </View>
          {totalOvertimeMinutes > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Überstunden gesamt:</Text>
              <Text style={styles.summaryValue}>
                {formatDuration(totalOvertimeMinutes, true)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fehlstunden:</Text>
            <Text style={styles.summaryValue}>{"\u2014"}</Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureContainer}>
          <Text style={styles.signatureLine}>
            Unterschrift Mitarbeiter: ___________________________{"     "}Datum:
            _______________
          </Text>
        </View>
      </Page>
    </Document>
  );
}
