"use client";
import React, { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import axios from "axios";

async function getFirstHospitalId() {
  try {
    const response = await axios.get("https://hack.flyingwaffle.ca/api/hospitals");
    const result = response.data;
    if (result.success && result.data.length > 0) {
      return result.data[0].hospital_id;
    } else {
      return "DEFAULT";
    }
  } catch (error) {
    return "DEFAULT";
  }
}

async function getLastPatientId(hospitalId: string) {
  try {
    const response = await axios.get(`https://hack.flyingwaffle.ca/api/hospitals/${hospitalId}/patients`);
    const result = response.data;
    if (result.success && result.data.length > 0) {
      const lastPatient = result.data[result.data.length - 1];
      return lastPatient.patient_id;
    }
    return null;
  } catch (error) {
    return null;
  }
}

function getNextPatientId(lastId: string | null) {
  if (!lastId) return "PAT-911-001";
  const match = lastId.match(/PAT-911-(\d+)/);
  if (match) {
    const nextNum = String(Number(match[1]) + 1).padStart(3, "0");
    return `PAT-911-${nextNum}`;
  }
  return `PAT-911-001`;
}

export default function CreatePatientButton({ report, callId }: { report: any, callId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleCreatePatient = async () => {
    setLoading(true);
    setResult(null);
    const hospitalId = await getFirstHospitalId();
    const lastPatientId = await getLastPatientId(hospitalId);
    const nextPatientId = getNextPatientId(lastPatientId);
    // Extract as much as possible from Gemini report
    const patientData = {
      patient_id: nextPatientId,
      name: report?.persons_involved || `Emergency Patient ${callId}`,
      age: null,
      gender: '',
      phone: '',
      address: report?.location || '',
      emergency_contact: {
        name: '',
        phone: '',
        relationship: 'caller'
      },
      admission_reason: report?.nature_of_emergency || 'Emergency call',
      diagnosis: report?.diagnosis || '',
      medical_history: [],
      allergies: [],
      medications: [],
      incident_report: JSON.stringify(report, null, 2),
      doctor_report: '',
      bed_id: '',
      status: 'admitted',
      priority: 'urgent'
    };
    try {
      const response = await axios.post(
        `https://hack.flyingwaffle.ca/api/hospitals/${hospitalId}/patients`,
        patientData,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data.success) {
        setResult(`Patient admitted: ${response.data.patient_id}`);
      } else {
        setResult(`Error: ${response.data.error}`);
      }
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Button variant="contained" color="secondary" onClick={handleCreatePatient} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : "Create Patient from Gemini Report"}
      </Button>
      {result && <div style={{ marginTop: 8 }}>{result}</div>}
    </div>
  );
}
