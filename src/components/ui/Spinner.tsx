export function Spinner({ testId = 'loading-spinner' }: { testId?: string }) {
  return (
    <div
      className="flex justify-center py-8"
      data-testid={testId}
      role="status"
      aria-label="Loading"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
    </div>
  );
}
