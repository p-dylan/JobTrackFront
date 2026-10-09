// src/pages/Dashboard/Dashboard.tsx
// Structure inspirée de la page Profil : bannière "hero" avec avatar en
// overlap, et sections en cartes repliables (même pattern que
// ProfileContact/ProfileSkills) via SectionCard.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Briefcase,
} from "lucide-react";
import { Card as StatCard } from "../../components/Dashboard/StatsCards/StatCard";
import { EventRow } from "../../components/Dashboard/RecentEvents/EventRow";
import { DashboardHeroBanner } from "../../components/Dashboard/DashboardHeroBanner";
import { EmptyState } from "../../components/Layout/EmptyState";
import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/Layout/PageTitle";
import { SectionCard } from "../../components/Layout/SectionCard";
import { useAuthStore } from "../../store/auth.store";
import { ApplicationApi } from "../../api/application.api";
import { JobOfferingApi } from "../../api/job_offering.api";
import { NotificationApi } from "../../api/notification.api";
import { NOTIFICATION_EVENT } from "../../constants/notification";
import { getInitials } from "../../utils/userDisplay";
import { timeAgo } from "../../utils/timeAgo";

// Le widget "Derniers événements" du dashboard n'affiche que les événements
// pas encore vus ; ils ne sont marqués comme vus qu'au clic sur "Voir tout"
// (jamais au simple montage, pour ne pas les griller sur un refresh
// accidentel). Une fois marqués, ils disparaissent du widget mais restent
// visibles dans l'historique complet.
const SEEN_EVENTS_KEY = "dashboard-seen-event-ids";

// Ce widget reste un aperçu rapide : au-delà, "Voir tout" prend le relais
// (vers l'historique complet).
const MAX_VISIBLE_EVENTS = 3;

// Accueil : bandeau du user, stats réelles (candidatures, offres) et dernières notifications.
export function Dashboard() {
  const [seenEventIds, setSeenEventIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(SEEN_EVENTS_KEY);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  });

  const user = useAuthStore((state) => state.user);

  const { data: myApplications = [] } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: () => ApplicationApi.getMine(),
  });
  // take: 1 : seul le total nous intéresse
  const { data: offersPage } = useQuery({
    queryKey: ["job_offerings", "count"],
    queryFn: () => JobOfferingApi.getAll({ take: 1 }),
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => NotificationApi.getAllNotifications(),
  });

  const activeApplicationsCount = myApplications.filter(
    (application) => application.status === "PENDING" || application.status === "ACCEPTED"
  ).length;

  const stats = [
    {
      label: "Candidatures actives",
      count: activeApplicationsCount,
      icon: TrendingUp,
      to: "/app/candidatures",
    },
    {
      // module entretien pas encore implémenté côté back
      label: "Entretiens prévus",
      count: 0,
      icon: Calendar,
      to: "/app/entretiens",
    },
    {
      label: "Offres disponibles",
      count: offersPage?.total ?? 0,
      icon: Briefcase,
      to: "/app/offers",
    },
  ];

  // Notifications déjà triées par date décroissante par le back.
  const recentEvents = useMemo(
    () =>
      notifications.map((notification) => ({
        id: notification.id,
        text: NOTIFICATION_EVENT[notification.event_type].text,
        icon: NOTIFICATION_EVENT[notification.event_type].icon,
        time: timeAgo(notification.created_at),
      })),
    [notifications]
  );

  const newEvents = useMemo(
    () => recentEvents.filter((event) => !seenEventIds.includes(event.id)),
    [recentEvents, seenEventIds]
  );
  const visibleEvents = newEvents.slice(0, MAX_VISIBLE_EVENTS);

  // Mémorise (localStorage) les événements affichés comme "vus" au clic sur "Voir tout".
  const markEventsAsSeen = () => {
    const merged = Array.from(
      new Set([...seenEventIds, ...recentEvents.map((event) => event.id)])
    );
    setSeenEventIds(merged);
    localStorage.setItem(SEEN_EVENTS_KEY, JSON.stringify(merged));
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
        <PageTitle
          title="Accueil"
          description="Vue d'ensemble de votre recherche d'emploi"
          icon={Home}
        />

        {/* Même convention que ProfileIdentity/Contact/Skills : sections en
            pleine largeur sur mobile (-mx-4), avec la marge de page qui
            revient à partir de sm. */}
        <div className="-mx-4 sm:mx-0 flex-1 flex flex-col">
          <div className="flex flex-col divide-y divide-base-300">
            <DashboardHeroBanner initials={getInitials(user)} name={user?.first_name ?? ""} />

            <SectionCard title="Stats rapides" collapsible={false}>
              <div className="-m-4 grid grid-cols-3">
                {stats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>
            </SectionCard>

            {/* Relances et entretiens n'ont pas encore de back : état vide. */}
            <SectionCard title="Prochaines actions" collapsible={false}>
              <EmptyState
                icon={CheckCircle2}
                message="Aucune action en attente, vous êtes à jour !"
              />
            </SectionCard>

            <SectionCard
              title="Derniers événements"
              collapsible={false}
              headerTo="/app/historique"
              onHeaderClick={markEventsAsSeen}
              headerAction={
                <span className="flex items-center gap-1 text-sm">
                  Voir tout
                  <ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
                </span>
              }
            >
              {newEvents.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  message="Rien de nouveau pour l'instant, revenez plus tard !"
                />
              ) : (
                <div className="divide-y divide-base-200">
                  {visibleEvents.map(({ id, ...event }) => (
                    <EventRow key={id} {...event} />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="flex-1 bg-base-100" />
        </div>
      </PageContainer>
    </div>
  );
}
