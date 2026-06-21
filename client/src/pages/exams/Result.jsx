import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams } from "react-router-dom";

export default function Result() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/attempts/mine`);
        const attempt =
          res.data.find((a) => a._id === attemptId) || res.data[0];
        if (!attempt) return setData(null);
        const examRes = await api.get(`/exams/${attempt.exam}`);
        setData({ attempt, exam: examRes.data });
      } catch (err) {
        console.error(err);
      }
    })();
  }, [attemptId]);

  if (!data)
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2">Loading result...</div>
      </div>
    );
  const { attempt, exam } = data;

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <h2 className="fw-bold text-success">Result: {exam.title}</h2>
        <p className="lead">
          <span className="fw-semibold">Your score:</span>{" "}
          <span className="badge bg-success fs-5">{attempt.score}</span>
        </p>
      </div>
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10 col-12">
          {exam.questions.map((q, i) => {
            const userSel = attempt.answers[i];
            return (
              <div key={q._id} className="card mb-3 border-0 shadow-sm">
                <div className="card-body">
                  <p className="mb-2">
                    <strong>Q{i + 1}.</strong> {q.question}
                  </p>
                  <ul className="list-group list-group-flush">
                    {q.options.map((opt, oi) => (
                      <li
                        key={oi}
                        className={
                          "list-group-item d-flex align-items-center" +
                          (q.answer === opt ||
                          q.answer === oi ||
                          q.answer === q.options[oi]
                            ? " list-group-item-success"
                            : userSel === oi
                            ? " list-group-item-warning"
                            : "")
                        }
                      >
                        <span className="me-2 fw-bold">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span>{opt}</span>
                        {q.answer === opt ||
                        q.answer === oi ||
                        q.answer === q.options[oi] ? (
                          <span className="badge bg-success ms-2">Correct</span>
                        ) : null}
                        {userSel === oi && (
                          <span className="badge bg-info ms-2">
                            Your answer
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
