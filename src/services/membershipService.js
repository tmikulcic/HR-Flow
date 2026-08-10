import {
  createMembershipRecord,
  membershipRepository,
} from '../repositories/index.js';

export function saveMembershipForUser(user) {
  const membership = createMembershipRecord(user);
  const existingMembership = membershipRepository.getById(membership.id);

  return existingMembership
    ? membershipRepository.update(membership.id, membership)
    : membershipRepository.add(membership);
}
