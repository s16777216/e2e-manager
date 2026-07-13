import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectData } from "../hooks/useProjectData";
import ProjectFormGeneralBlock from "../components/ProjectFormGeneralBlock";
import { generalFormSchema } from "../schema";
import z from "zod";

export default function ProjectCreateView() {
  const navigate = useNavigate();
  const { handleCreateProject } = useProjectData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: z.infer<typeof generalFormSchema>) => {
    setIsSubmitting(true);
    try {
      const createProjectResult = await handleCreateProject(
        data.name,
        data.description,
      );
      if (createProjectResult) {
        navigate(`/project/${createProjectResult.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-8 mx-auto w-full space-y-10">
      <ProjectFormGeneralBlock
        formSchema={generalFormSchema}
        defaultValues={{
          name: "",
          description: "",
        }}
        onSubmit={handleSubmit}
        submitLabel={isSubmitting ? "建立中..." : "確定建立"}
      />
    </div>
  );
}
