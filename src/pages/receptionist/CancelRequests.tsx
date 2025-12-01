import ReceptionistTable from '@/components/receptionist/ReceptionistTable'
import { useCancelRequests } from '@/hooks/use-cancel-requests'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function CancelRequests() {
    const { data: cancelRequests, isLoading, isError, error, refetch, isFetching } = useCancelRequests()

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Cancel Requests</h1>
                    <p className="text-sm text-muted-foreground">
                        Review and manage appointment cancellation requests.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    {isFetching ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : isError ? (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            <p>Error loading cancel requests: {error?.message || 'Unknown error'}</p>
                        </div>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="mt-4">
                    <ReceptionistTable 
                        items={cancelRequests} 
                        basePath="/receptionist/cancel-requests"
                        type="appointment"
                    />
                    {cancelRequests?.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                            No cancellation requests found.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
