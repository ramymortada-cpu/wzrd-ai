/**
 * MyAudits.tsx — Sprint A: History of past full audits
 * Route: /app/my-audits
 */

import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Loader2, ArrowRight } from 'lucide-react';

function scoreColor(score: number | null | undefined) {
  if (!score && score !== 0) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MyAudits() {
  const [, navigate] = useLocation();
  useAuth({ redirectOnUnauthenticated: true });
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const { data: audits, isLoading } = trpc.fullAudit.myAudits.useQuery();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-black">{isAr ? 'تحليلاتي' : 'My Audits'}</h1>
        </div>
        <Button size="sm" onClick={() => navigate('/app/full-audit')}>
          {isAr ? '+ تحليل جديد' : '+ New Audit'}
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </div>
      )}

      {!isLoading && (!audits || audits.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-medium text-muted-foreground mb-4">
              {isAr ? 'مفيش تحليلات لسه' : 'No audits yet'}
            </p>
            <Button onClick={() => navigate('/app/full-audit')}>
              {isAr ? 'ابدأ أول تحليل' : 'Start First Audit'}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && audits && audits.length > 0 && (
        <div className="space-y-3">
          {audits.map(audit => (
            <Card
              key={audit.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => navigate(`/app/full-audit/${audit.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">{audit.companyName}</p>
                    <Badge variant="outline" className="text-xs shrink-0">{audit.industry}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(audit.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {audit.overallScore !== null && audit.overallScore !== undefined && (
                    <span className={`text-3xl font-black ${scoreColor(audit.overallScore)}`}>
                      {audit.overallScore}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
