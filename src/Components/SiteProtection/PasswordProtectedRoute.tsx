import React, { useState, useEffect } from "react";

const PASSWORD = "this is password";

const PasswordProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isLocal = true;  // set true in development

    // If local, just render without password
    if (isLocal) {
        return <>{children}</>;
    }

    const [enteredPassword, setEnteredPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const savedAuth = localStorage.getItem("authenticated");
        if (savedAuth === "true") {
            setIsAuthenticated(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (enteredPassword === PASSWORD) {
            setIsAuthenticated(true);
            localStorage.setItem("authenticated", "true");
        } else {
            alert("Incorrect password");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded shadow-md w-80"
                >
                    <h2 className="text-xl font-bold mb-4 text-center">Enter Password</h2>
                    <input
                        type="password"
                        value={enteredPassword}
                        onChange={(e) => setEnteredPassword(e.target.value)}
                        className="border border-gray-300 p-2 w-full mb-4 rounded"
                        placeholder="Password"
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
                    >
                        Submit
                    </button>
                </form>
            </div>
        );
    }

    return <>{children}</>;
};

export default PasswordProtectedRoute;
