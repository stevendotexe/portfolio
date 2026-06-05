"use client";

import { useState, useTransition } from "react";
import { toggleCollectionPublishedAction } from "@/app/admin/actions";

export function CollectionPublishToggle({
  collectionId,
  initialPublished,
}: {
  collectionId: string;
  initialPublished: boolean;
}) {
  const [published, setPublished] = useState(initialPublished);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const next = !published;
    setPublished(next);
    startTransition(async () => {
      const result = await toggleCollectionPublishedAction(collectionId, next);
      if (!result.ok) {
        setPublished(!next);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`admin-pill${published ? " admin-pill-published" : ""} admin-pill-button`}
      aria-label={published ? "Unpublish collection" : "Publish collection"}
    >
      {published ? "Published" : "Draft"}
    </button>
  );
}
