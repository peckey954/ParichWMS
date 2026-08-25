"use client";

import { OptimizedFormulaView } from "@/components/production/optimized-formula-view";
import { useRecipeRun } from "@/components/production/recipe-run";

export default function OptimizedFormulaPage() {
  const { publishedMaterials } = useRecipeRun();
  return <OptimizedFormulaView materials={publishedMaterials} mode="published" />;
}
