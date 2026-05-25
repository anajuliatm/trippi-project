export interface UserProfile {
  username: string;
  email: string;
  password: string;
}

let currentUserProfile: UserProfile = {
  username: "ana_julia",
  email: "ana.julia@trippi.com",
  password: "12345678",
};

export function getCurrentUserProfile() {
  return currentUserProfile;
}

export function updateCurrentUserProfile(nextProfile: UserProfile) {
  currentUserProfile = nextProfile;
  return currentUserProfile;
}