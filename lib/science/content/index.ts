import { bodyTopics } from "./body";
import { earthTopics } from "./earth";
import { lifeTopics } from "./life";
import { physicalTopics } from "./physical";
import type { LabTopic } from "../types";

/**
 * The Wonder Lab's shelves, in the order a child meets them.
 *
 * Not alphabetical and not by strand. The order is roughly "what can you check with your
 * own hands today": floating and pushing come first because a four-year-old can test them
 * at the sink and on the floor this afternoon, and space comes late because the only
 * honest way to check it is to think.
 *
 * The lab is deliberately wider than any one child sees. A three-year-old is offered the
 * explorer stations and nothing else; the topics with no explorer station simply are not
 * on their shelf. Breadth here is what makes the tiering mean something — if every topic
 * had to work for every age, every topic would be written for the middle.
 */
export const labTopics: LabTopic[] = [
  ...physicalTopics.filter((topic) => topic.id === "floating" || topic.id === "push-pull"),
  ...lifeTopics.filter((topic) => topic.id === "living" || topic.id === "plants"),
  ...physicalTopics.filter((topic) => topic.id === "magnets" || topic.id === "light"),
  ...earthTopics.filter((topic) => topic.id === "weather"),
  ...bodyTopics.filter((topic) => topic.id === "senses"),
  ...lifeTopics.filter((topic) => topic.id === "lifecycles" || topic.id === "habitats"),
  ...physicalTopics.filter((topic) => topic.id === "states" || topic.id === "sound"),
  ...earthTopics.filter((topic) => topic.id === "rocks"),
  ...bodyTopics.filter((topic) => topic.id === "human-body"),
  ...earthTopics.filter((topic) => topic.id === "space"),
  ...physicalTopics.filter((topic) => topic.id === "machines"),
];

export { bodyTopics, earthTopics, lifeTopics, physicalTopics };
