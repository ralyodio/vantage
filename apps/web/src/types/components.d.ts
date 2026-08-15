declare module '@/components/SearchBar' {
  const SearchBar: React.FC<{ onSearch: (query: string) => void; isLoading: boolean }>;
  export default SearchBar;
}

declare module '@/components/LoadingScreen' {
  const LoadingScreen: React.FC;
  export default LoadingScreen;
}

declare module '@/components/ProfileCard' {
  import type { UserProfile } from '@vantage/shared';
  const ProfileCard: React.FC<{ profile: UserProfile }>;
  export default ProfileCard;
}

declare module '@/components/RiskMeter' {
  import type { RiskAssessment } from '@vantage/shared';
  const RiskMeter: React.FC<{ risk: RiskAssessment }>;
  export default RiskMeter;
}
