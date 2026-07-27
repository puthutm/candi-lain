/**
 * SIAKAD API Client Library
 * 
 * Digunakan oleh modul Keuangan untuk:
 * 1. Pull data mahasiswa aktif per prodi/periode (generate tagihan)
 * 2. Push event finance.clearance_changed ke SIAKAD
 */

export interface SiakadStudent {
  id: string;
  userId: string;
  fullName: string;
  studyProgramId: string;
  studyProgramName: string;
  academicStatus: string;
  semester: number;
}

export interface SiakadStudyProgram {
  id: string;
  name: string;
  facultyName: string;
}

export interface SiakadGraduationCandidate {
  id: string;
  userId: string;
  fullName: string;
  studyProgramId: string;
  graduationPeriod: string;
}

export interface ClearanceEventPayload {
  userId: string;
  newStatus: "aktif" | "tertahan" | "lms_dibatasi" | "lms_suspend";
  reason?: string;
  timestamp: string;
}

class SiakadClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.SIAKAD_API_URL || "http://siakad-platform:3000/api";
    this.apiKey = process.env.SIAKAD_API_KEY || "internal-service-key";
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      "X-Service-Name": "keuangan-platform",
    };
  }

  /**
   * Pull data mahasiswa aktif per prodi/periode akademik
   */
  async getActiveStudents(params: {
    studyProgramId?: string;
    academicPeriod?: string;
  }): Promise<SiakadStudent[]> {
    const queryParams = new URLSearchParams();
    if (params.studyProgramId) queryParams.set("studyProgramId", params.studyProgramId);
    if (params.academicPeriod) queryParams.set("academicPeriod", params.academicPeriod);
    queryParams.set("status", "aktif");

    const response = await fetch(`${this.baseUrl}/students?${queryParams.toString()}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`SIAKAD API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    return data.students || [];
  }

  /**
   * Pull daftar program studi
   */
  async getStudyPrograms(): Promise<SiakadStudyProgram[]> {
    const response = await fetch(`${this.baseUrl}/study-programs`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`SIAKAD API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    return data.studyPrograms || [];
  }

  /**
   * Pull kandidat wisuda (status lulus)
   */
  async getGraduationCandidates(params: {
    studyProgramId?: string;
    graduationPeriod?: string;
  }): Promise<SiakadGraduationCandidate[]> {
    const queryParams = new URLSearchParams();
    if (params.studyProgramId) queryParams.set("studyProgramId", params.studyProgramId);
    if (params.graduationPeriod) queryParams.set("graduationPeriod", params.graduationPeriod);

    const response = await fetch(`${this.baseUrl}/students/graduation-candidates?${queryParams.toString()}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`SIAKAD API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    return data.candidates || [];
  }

  /**
   * Push event clearance ke SIAKAD
   */
  async publishClearanceEvent(payload: ClearanceEventPayload): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/internal/clearance`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[SIAKAD Client] Failed to publish clearance event: ${response.status}`, await response.text());
      return false;
    }

    return true;
  }

  /**
   * Health check koneksi ke SIAKAD
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.headers,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const siakadClient = new SiakadClient();
