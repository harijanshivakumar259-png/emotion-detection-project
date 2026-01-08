// app.js
const { useState, useEffect } = React;

// ==== CONFIG ====
const MAX_DAILY_USES = 10;

// ==== HELPERS: USERS & USAGE ====
function loadUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getUserDataKey(email) {
  return "userData_" + email;
}

function getUserData(email) {
  const key = getUserDataKey(email);
  const raw = localStorage.getItem(key);
  const today = getTodayDate();

  if (!raw) {
    return {
      usage: { date: today, count: 0 },
      emotions: [],
    };
  }

  let data = JSON.parse(raw);
  if (!data.usage || data.usage.date !== today) {
    data.usage = { date: today, count: 0 };
  }
  if (!data.emotions) data.emotions = [];
  return data;
}

function saveUserData(email, data) {
  localStorage.setItem(getUserDataKey(email), JSON.stringify(data));
}

function getUsageInfo(email) {
  const data = getUserData(email);
  const count = data.usage.count || 0;
  const remaining = Math.max(0, MAX_DAILY_USES - count);
  return { count, remaining, limit: MAX_DAILY_USES };
}

function addUsageAndEmotion(email, emotion) {
  const data = getUserData(email);
  data.usage.count = (data.usage.count || 0) + 1;
  data.emotions.push({
    emotion,
    time: new Date().toISOString(),
  });
  saveUserData(email, data);
  return data;
}

// ==== COMPONENTS ====

function Register({ switchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function handleRegister() {
    setError("");

    if (!name || !email || !pass) {
      setError("All fields are required.");
      return;
    }

    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
      setError("⚠️ This email is already registered.");
      return;
    }

    users.push({ name, email, pass });
    saveUsers(users);

    alert("Registration successful! Please login.");
    switchToLogin();
  }

  return (
    <div className="container">
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}

      <input
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Email ID"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Set Password"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      <button className="main-btn" onClick={handleRegister}>
        Register
      </button>

      <button className="link-btn" onClick={switchToLogin}>
        Already have an account? Login
      </button>
    </div>
  );
}

function Login({ switchToRegister, switchToForgot, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    setError("");
    const users = loadUsers();
    const user = users.find((u) => u.email === email && u.pass === pass);

    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    onLoginSuccess(user);
  }

  return (
    <div className="container">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}

      <input
        placeholder="Email ID"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      <button className="main-btn" onClick={handleLogin}>
        Login
      </button>

      <button className="link-btn" onClick={switchToRegister}>
        New user? Register here
      </button>

      <button className="link-btn" onClick={switchToForgot}>
        Forgot password?
      </button>
    </div>
  );
}

function ForgotPassword({ switchToLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleReset() {
    setError("");
    setSuccess("");

    if (!email || !pass || !confirm) {
      setError("All fields are required.");
      return;
    }

    if (pass !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const users = loadUsers();
    const idx = users.findIndex((u) => u.email === email);

    if (idx === -1) {
      setError("Email not registered.");
      return;
    }

    users[idx].pass = pass;
    saveUsers(users);
    setSuccess("Password reset successful. You can now login.");
  }

  return (
    <div className="container">
      <h2>Forgot Password</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <input
        placeholder="Registered Email ID"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="New Password"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      <input
        placeholder="Confirm New Password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <button className="main-btn" onClick={handleReset}>
        Reset Password
      </button>

      <button className="link-btn" onClick={switchToLogin}>
        Back to Login
      </button>
    </div>
  );
}

function Chatbot({ user, goToDashboard, onLogout }) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `Welcome ${user.name}! Hold the button and speak to detect emotion.`,
    },
  ]);
  const [status, setStatus] = useState("");
  const [usageInfo, setUsageInfo] = useState(() => getUsageInfo(user.email));

  let mediaRecorder;
  let chunks = [];
  let startTime = 0;

  function addMsg(m) {
    setMessages((prev) => [...prev, m]);
  }

  async function startRec() {
    const currentUsage = getUsageInfo(user.email);
    if (currentUsage.remaining <= 0) {
      addMsg({
        sender: "bot",
        text: `⚠ You reached today's limit of ${currentUsage.limit} uses.`,
      });
      return;
    }

    setStatus("Listening...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });

        addMsg({ sender: "user", text: "🎤 Voice message" });

        setStatus("Analyzing emotion...");

        try {
          const res = await sendAudioToBackend(blob);
          addMsg({
            sender: "bot",
            text: `Emotion: ${res.emotion} (${(
              res.confidence * 100
            ).toFixed(1)}%)`,
          });

          const newData = addUsageAndEmotion(user.email, res.emotion);
          const newUsage = getUsageInfo(user.email);
          setUsageInfo(newUsage);
        } catch (e) {
          addMsg({ sender: "bot", text: "❌ Backend offline or error." });
        }

        setStatus("");
      };

      mediaRecorder.start();
      startTime = Date.now();
    } catch (e) {
      setStatus("");
      addMsg({
        sender: "bot",
        text: "⚠ Cannot access microphone. Please allow mic permission.",
      });
    }
  }

  function stopRec() {
    if (!mediaRecorder) return;
    const dur = Date.now() - startTime;
    if (dur < 1500) {
      addMsg({
        sender: "bot",
        text: "Please speak at least 1.5 seconds.",
      });
      mediaRecorder.stop();
      return;
    }
    mediaRecorder.stop();
  }

  return (
    <div className="container">
      <div className="nav-row">
        <button onClick={goToDashboard}>📊 Dashboard</button>
        <button onClick={onLogout}>Logout</button>
      </div>

      <h2>🎤 Emotion Chatbot</h2>

      <div className="badge">
        <span>
          Usage today: {usageInfo.count} / {usageInfo.limit} · Remaining:{" "}
          {usageInfo.remaining}
        </span>
      </div>

      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`}>
            {m.text}
          </div>
        ))}
      </div>

      <button
        id="recordBtn"
        onMouseDown={startRec}
        onMouseUp={stopRec}
        onTouchStart={startRec}
        onTouchEnd={stopRec}
      >
        Hold to Speak
      </button>

      <p className="usage-info">{status}</p>
    </div>
  );
}

function Dashboard({ user, goToChat, onLogout }) {
  const [summary, setSummary] = useState(null);

  // Chart instance ref (no need to destructure useRef, just use React.useRef)
  const chartRef = React.useRef(null);

  useEffect(() => {
    const data = getUserData(user.email);
    const usage = getUsageInfo(user.email);

    const counts = {};
    data.emotions.forEach((e) => {
      counts[e.emotion] = (counts[e.emotion] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    setSummary({
      total: data.emotions.length,
      todayCount: usage.count,
      limit: usage.limit,
      labels,
      values,
    });

    // Destroy old chart if exists
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = document.getElementById("emotionChart");
    if (ctx && labels.length > 0) {
      chartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Emotion frequency",
              data: values,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }, [user.email]);

  return (
    <div className="container">
      <div className="nav-row">
        <button onClick={goToChat}>💬 Chat</button>
        <button onClick={onLogout}>Logout</button>
      </div>

      <h2>📊 Dashboard</h2>

      {!summary ? (
        <p>Loading stats...</p>
      ) : (
        <>
          <p>
            <strong>User:</strong> {user.name} ({user.email})
          </p>
          <p>
            <strong>Today:</strong> {summary.todayCount} / {summary.limit}{" "}
            uses
          </p>
          <p>
            <strong>Total emotion analyses:</strong> {summary.total}
          </p>

          <div className="chart-box">
            <p>Emotion distribution (all time)</p>
            {summary.labels.length === 0 ? (
              <p>No emotion data yet. Try using the chatbot first.</p>
            ) : (
              <canvas id="emotionChart" height="160"></canvas>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  const [page, setPage] = useState("register");
  const [loggedUser, setLoggedUser] = useState(null);

  function handleLogout() {
    setLoggedUser(null);
    setPage("login");
  }

  if (page === "register") {
    return (
      <Register
        switchToLogin={() => setPage("login")}
      />
    );
  }

  if (page === "login") {
    return (
      <Login
        switchToRegister={() => setPage("register")}
        switchToForgot={() => setPage("forgot")}
        onLoginSuccess={(u) => {
          setLoggedUser(u);
          setPage("chat");
        }}
      />
    );
  }

  if (page === "forgot") {
    return <ForgotPassword switchToLogin={() => setPage("login")} />;
  }

  if (!loggedUser) {
    // Fallback: no user but not on login/register => show login
    return (
      <Login
        switchToRegister={() => setPage("register")}
        switchToForgot={() => setPage("forgot")}
        onLoginSuccess={(u) => {
          setLoggedUser(u);
          setPage("chat");
        }}
      />
    );
  }

  if (page === "chat") {
    return (
      <Chatbot
        user={loggedUser}
        goToDashboard={() => setPage("dashboard")}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "dashboard") {
    return (
      <Dashboard
        user={loggedUser}
        goToChat={() => setPage("chat")}
        onLogout={handleLogout}
      />
    );
  }

  return <div>Unknown page</div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
