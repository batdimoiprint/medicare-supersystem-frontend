import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import supabase from "@/utils/supabase";

export default function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Verifying your account...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  useEffect(() => {
    async function completeRegistration() {
      if (error) {
        setLoading(false);
        setErrorMsg(errorDesc || "Verification link is invalid or expired.");
        return;
      }

      try {
        // Get current auth session (must be verified)
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (!session || !session.user) {
          setMessage("Waiting for email verification...");
          setLoading(false);
          return;
        }

        if (!session.user.email_confirmed_at) {
          setMessage("Please confirm your email first.");
          setLoading(false);
          return;
        }

        // Retrieve saved registration data
        const saved = localStorage.getItem("pending_registration");
        if (!saved) {
          alert("No registration data found. Please register again.");
          navigate("/register");
          return;
        }

        const data = JSON.parse(saved);

        setMessage("Inserting patient data...");

        const { data: patientData, error: patientError } = await supabase
          .schema("patient_record")
          .from("patient_tbl")
          .insert({
            f_name: data.f_name,
            l_name: data.l_name,
            m_name: data.m_name || null,
            suffix: data.suffix || null,
            birthdate: data.birthdate || null,
            gender: data.gender,
            email: data.email || null,
            password: data.password, // hashed password
            house_no: data.house_no || null,
            street: data.street,
            barangay: data.barangay || null,
            city: data.city,
            country: data.country || null,
            blood_type: data.blood_type || null,
            pri_contact_no: data.pri_contact_no,
            sec_contact_no: data.sec_contact_no || null,
            account_status: "Active",
            created_at: new Date().toISOString(),
          })
          .select("patient_id")
          .single();

        if (patientError) {
          setMessage("Error inserting patient data.");
          setLoading(false);
          return;
        }

        setMessage("Inserting emergency contact...");

        const { error: emergencyError } = await supabase
          .schema("patient_record")
          .from("emergency_contact_tbl")
          .insert({
            patient_id: patientData.patient_id,
            ec_f_name: data.ec_f_name,
            ec_l_name: data.ec_l_name,
            ec_m_name: data.ec_m_name || null,
            ec_contact_no: data.ec_contact_no,
            ec_relationship: data.ec_relationship,
            ec_email: data.ec_email || null,
            created_at: new Date().toISOString(),
          });

        if (emergencyError) {
          setMessage("Error inserting emergency contact.");
          setLoading(false);
          return;
        }

        localStorage.removeItem("pending_registration");

        setMessage("Registration complete!");
        alert("Email verified! Registration is complete.");
        navigate("/login");

      } catch (err) {
        console.error("VerifyPage error:", err);
        setMessage("An error occurred. Please try again.");
        setLoading(false);
      }
    }

    completeRegistration();
  }, [navigate, error, errorDesc]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const saved = localStorage.getItem("pending_registration");
      if (!saved) {
        alert("No registration data found. Please register again.");
        navigate("/register");
        return;
      }
      const data = JSON.parse(saved);

      // Resend verification email securely
      const { error } = await supabase.auth.admin.generateLink({
        type: "signup",
        email: data.email,
        password: data.password, // use the same hashed password or flow you originally saved
      });

      if (error) {
        alert("Failed to resend verification email: " + error.message);
      } else {
        alert("Verification email resent! Check your inbox.");
      }
    } catch (err) {
      console.error("Resend error:", err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="p-8 text-center">
      {loading && <div className="mb-4">⏳ Loading...</div>}
      <h1 className="text-2xl font-bold mb-2">{message}</h1>

      {errorMsg && (
        <div className="text-red-600 mb-4">{errorMsg}</div>
      )}

      {errorMsg && (
        <button
          onClick={handleResend}
          disabled={resendLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {resendLoading ? "Resending..." : "Resend Verification Email"}
        </button>
      )}
    </div>
  );
}
