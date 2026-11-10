import React, { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function ApplyJob() {

  const { jobId } = useParams();   // 🔥 jobId URL la irundhu edukum

  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState(null);

  const handleFile = (e) => {
    setResume(e.target.files[0]);
  };

  const applyJob = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("coverLetter", coverLetter);

    try {

      await axios.post(
        `http://localhost:5000/api/applications/${jobId}`,  // 🔥 correct API
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      alert("✅ Application submitted successfully");

    } catch (error) {
      console.log(error);
      alert("❌ Application failed");
    }
  };

  return (

    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#f4f6f8"
    }}>

      <form
        onSubmit={applyJob}
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "10px",
          width: "500px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)"
        }}
      >

        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Apply for Job
        </h2>

        <label>Cover Letter</label>

        <textarea
          placeholder="Write your cover letter..."
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          style={{
            width: "100%",
            height: "120px",
            marginTop: "5px",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc"
          }}
        />

        <br /><br />

        <label>Upload Resume</label>

        <input
          type="file"
          onChange={handleFile}
          required
        />

        <br /><br />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Apply Now
        </button>

      </form>

    </div>

  );
}

export default ApplyJob;