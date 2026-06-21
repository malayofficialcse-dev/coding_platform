import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function EnrollButton({ courseId }) {
  const { user } = useContext(AuthContext);
  const nav = useNavigate();
  return (
    <button
      className="btn btn-outline-primary btn-sm"
      onClick={() => {
        if (!user) nav("/login");
        else nav(`/enroll/${courseId}`);
      }}
    >
      Enroll Now
    </button>
  );
}
export default EnrollButton;
