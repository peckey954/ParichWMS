"use client";

import { OptimizedFormulaView } from "@/components/production/optimized-formula-view";
import { useRecipeRun } from "@/components/production/recipe-run";

export default function OptimizedFormulaPreviewPage() {
  const { draftMaterials } = useRecipeRun();
  return <OptimizedFormulaView materials={draftMaterials} mode="preview" />;
}
