import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import { IonSpinner } from "@ionic/react";
import { useAuth } from "../hooks/useAuth";

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  if (isChecking) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <IonSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return <Redirect to="/home" />;
  }

  return <>{children}</>;
};

export default AdminGuard;

