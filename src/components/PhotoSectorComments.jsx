import { photoSectorComments, photoSectorLabel } from "@/lib/casePhotos.mjs";

export default function PhotoSectorComments({ photos }) {
  const groups = photoSectorComments(photos);
  if (!groups.length) return null;
  return <div className="my-4 grid gap-3" aria-label="Comentarios por sector">
    {groups.map(({ sector, comments }) => <section key={sector} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <h4 className="font-bold text-primary">{photoSectorLabel(sector)} · Comentarios</h4>
      {comments.map(comment => <p key={comment} className="mt-2 whitespace-pre-wrap break-words text-sm text-on-surface">{comment}</p>)}
    </section>)}
  </div>;
}
