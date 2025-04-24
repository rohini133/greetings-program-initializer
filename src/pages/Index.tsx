
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer"; 

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Always redirect to login page
    navigate("/login", { replace: true });
  }, [navigate]);

  // Add a placeholder div as children to satisfy the PageContainerProps requirement
  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome to Vivaas</h1>
          <p className="text-gray-500">
            Redirecting you to login...
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default Index;
