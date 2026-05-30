"""
Script to remove duplicate function definitions from App.jsx that are now in utils/
"""
import re
import sys

APP_FILE = r"C:\Users\عبدالله صلاح\Downloads\FIFAGROUP2-main\src\App.jsx"

# Functions to remove — these exactly match utils/ exports
FUNCS_TO_REMOVE = {
    # helpers.js
    "formatTransferDate", "usernameKey", "usernameToFirebaseEmail", "firebaseAuthMessage",
    "clean", "cleanId", "same", "toNumber", "formatMoney", "isEnabled", "normalizeKey",
    "removeBom", "parseCSV",
    # admin.js
    "isFifaAdminProfile", "isNotificationVisibleToMember", "pushTokenDocId",
    "adminRewardTypeLabel", "adminDecisionTypeLabel", "adminDecisionStatusLabel",
    "adminViolationCategoryLabel", "isFifaAdminMoneyTransfer", "isCorrectionMoneyTransfer",
    "hasMoneyTransferCorrection", "buildAdminTransferRestrictionPayload", "getAdminTargetMembers",
    "getTopBarTitle", "getActiveMemberRestrictions", "getBlockingTransferRestriction",
    "transferActionArabic", "transferRestrictionShortText", "transferRestrictionBlockMessage",
    "formatRestrictionNotificationBody", "timestampMs", "dateOnlyMs", "isTransferRestrictionActive",
    "getMemberName", "notificationTimeValue", "notificationDisplayDate", "isOfferExpired",
    "dateValue", "getFifaAdminNoticeTemplates", "getFifaAdminNoticeTemplate",
    "adminDecisionMainLine", "adminNoteCategoryLabel", "adminSeverityLabel",
    "transferWindowStatusLabel", "computeTransferWindowStats", "buildFifaAdminSmartAlerts",
    "isTransferMarketOpen",
    # canvas.js
    "wrapCanvasText", "exportDateTimeLabel", "isCompetitionCompleted",
    "competitionKnockoutColumnsForExport", "roundRect", "safeFileName", "triggerCanvasDownload",
    "normalizeCompetitionRewards", "rewardRankLabel", "drawStatBox",
    "buildHistoricalMemberExportStats", "exportBrandLogoUrl",
    # ui.js
    "toLatinDigits", "formatLatinNumber", "renderSmartIcon", "normalizeImageUrl",
    "toCssSize", "avatar", "linkIcon",
    # data.js
    "sortRecordsDesc", "trophySort", "unique", "normalizeDate", "seasonNumber",
    "buildTrophyMap", "groupMemberTrophies", "groupByTrophy", "buildArchiveSeasons",
    "computeSeasonRanking", "isFifaSystemMember", "isActiveSeasonMember", "getActiveMembers",
    "getPlayerStableId", "addDays", "localDateKey", "rowBelongsToTransferWindow",
    "hasRecord", "getFinanceMemberId", "getFinanceFromMemberId", "getFinanceToMemberId",
    # competition.js
    "competitionTypeKey", "isLeagueGroupsCompetition", "isLinkedLeagueGroupsCup",
    "isKnockoutCompetitionType", "uniqueCleanIds", "getCompetitionExcludedMemberIds",
    "isCompetitionExcludedMember", "isCompetitionExcludedMatch",
    "filterCompetitionParticipantsForCalculation", "filterCompetitionMatchesForCalculation",
    "matchInvolvesMember", "isWaitingCompetitionMatch", "isGroupOrLeagueStageMatch",
    "competitionAbsenceInfoForMember", "getApprovedCompetitionChampionName",
    "generateLeagueRoundRobinMatches", "computeLeagueStandings", "compareLeagueStanding",
    "leagueStandingTieKey", "annotateLeagueStandings", "shuffleRows",
    "distributeSeedPotsToGroups", "groupLetterName", "generateWorldCupMatches",
    "worldCupGroupStageReady", "worldCupGroupRows", "computeWorldCupQualifiedRows",
    "computeWorldCupQualifiedIds", "worldCupQualifierTokenMap", "resolveWorldCupDependencies",
    "championsLeagueGroupLetterName", "buildBalancedGroupMatchPairs",
    "generateChampionsLeagueMatches", "championsLeagueGroupStageReady",
    "championsLeagueGroupRows", "computeChampionsLeagueQualifiedRows",
    "computeChampionsLeagueQualifiedIds", "championsLeagueQualifierTokenMap",
    "resolveChampionsLeagueDependencies", "generateSeededKnockoutBracketMatches",
    "resolveKnockoutBracketDependencies", "knockoutBracketSizeForCount",
    "normalizeCupManualPairings", "buildManualKnockoutBracketSlots", "buildSeededBracketSlots",
    "roundLabelForBracket", "matchShortLabel", "matchLoserInfo", "getKnockoutChampion",
    "getKnockoutRewardRows", "resolveLeagueQualifierDependencies", "linkedCupGroupIsReady",
    "sortedCompetitionMatchesForSchedule", "competitionMatchSortValue", "competitionTypeArabic",
    "competitionTimeValue", "buildLinkedLeagueCupDisplayCompetition",
    # seasonCenter.js
    "getSeasonCenterCompetitionMatches", "isSeasonCenterOpenMatch",
    "getSeasonCenterCompetitionStats", "getSeasonCenterRadarItems", "getSeasonCenterEventFeed",
    "seasonCenterEventDateLabel", "isSeasonCenterActiveOffer", "seasonCenterPhaseLabel",
}

IMPORT_LINE = (
    "import { "
    "formatTransferDate, usernameKey, usernameToFirebaseEmail, firebaseAuthMessage, "
    "clean, cleanId, same, toNumber, formatMoney, isEnabled, normalizeKey, removeBom, parseCSV, "
    "isFifaAdminProfile, isNotificationVisibleToMember, pushTokenDocId, adminRewardTypeLabel, "
    "adminDecisionTypeLabel, adminDecisionStatusLabel, adminViolationCategoryLabel, "
    "isFifaAdminMoneyTransfer, isCorrectionMoneyTransfer, hasMoneyTransferCorrection, "
    "buildAdminTransferRestrictionPayload, getAdminTargetMembers, getTopBarTitle, "
    "getActiveMemberRestrictions, getBlockingTransferRestriction, transferActionArabic, "
    "transferRestrictionShortText, transferRestrictionBlockMessage, formatRestrictionNotificationBody, "
    "timestampMs, dateOnlyMs, isTransferRestrictionActive, getMemberName, notificationTimeValue, "
    "notificationDisplayDate, isOfferExpired, dateValue, getFifaAdminNoticeTemplates, "
    "getFifaAdminNoticeTemplate, adminDecisionMainLine, adminNoteCategoryLabel, adminSeverityLabel, "
    "transferWindowStatusLabel, computeTransferWindowStats, buildFifaAdminSmartAlerts, isTransferMarketOpen, "
    "wrapCanvasText, exportDateTimeLabel, isCompetitionCompleted, competitionKnockoutColumnsForExport, "
    "roundRect, safeFileName, triggerCanvasDownload, normalizeCompetitionRewards, rewardRankLabel, "
    "drawStatBox, buildHistoricalMemberExportStats, exportBrandLogoUrl, "
    "toLatinDigits, formatLatinNumber, renderSmartIcon, normalizeImageUrl, toCssSize, avatar, linkIcon, "
    "sortRecordsDesc, trophySort, unique, normalizeDate, seasonNumber, buildTrophyMap, groupMemberTrophies, "
    "groupByTrophy, buildArchiveSeasons, computeSeasonRanking, isFifaSystemMember, isActiveSeasonMember, "
    "getActiveMembers, getPlayerStableId, addDays, localDateKey, rowBelongsToTransferWindow, "
    "hasRecord, getFinanceMemberId, getFinanceFromMemberId, getFinanceToMemberId, "
    "competitionTypeKey, isLeagueGroupsCompetition, isLinkedLeagueGroupsCup, isKnockoutCompetitionType, "
    "uniqueCleanIds, getCompetitionExcludedMemberIds, isCompetitionExcludedMember, "
    "isCompetitionExcludedMatch, filterCompetitionParticipantsForCalculation, "
    "filterCompetitionMatchesForCalculation, matchInvolvesMember, isWaitingCompetitionMatch, "
    "isGroupOrLeagueStageMatch, competitionAbsenceInfoForMember, getApprovedCompetitionChampionName, "
    "generateLeagueRoundRobinMatches, computeLeagueStandings, compareLeagueStanding, "
    "leagueStandingTieKey, annotateLeagueStandings, shuffleRows, distributeSeedPotsToGroups, "
    "groupLetterName, generateWorldCupMatches, worldCupGroupStageReady, worldCupGroupRows, "
    "computeWorldCupQualifiedRows, computeWorldCupQualifiedIds, worldCupQualifierTokenMap, "
    "resolveWorldCupDependencies, championsLeagueGroupLetterName, buildBalancedGroupMatchPairs, "
    "generateChampionsLeagueMatches, championsLeagueGroupStageReady, championsLeagueGroupRows, "
    "computeChampionsLeagueQualifiedRows, computeChampionsLeagueQualifiedIds, "
    "championsLeagueQualifierTokenMap, resolveChampionsLeagueDependencies, "
    "generateSeededKnockoutBracketMatches, resolveKnockoutBracketDependencies, "
    "knockoutBracketSizeForCount, normalizeCupManualPairings, buildManualKnockoutBracketSlots, "
    "buildSeededBracketSlots, roundLabelForBracket, matchShortLabel, matchLoserInfo, "
    "getKnockoutChampion, getKnockoutRewardRows, resolveLeagueQualifierDependencies, "
    "linkedCupGroupIsReady, sortedCompetitionMatchesForSchedule, competitionMatchSortValue, "
    "competitionTypeArabic, competitionTimeValue, buildLinkedLeagueCupDisplayCompetition, "
    "getSeasonCenterCompetitionMatches, isSeasonCenterOpenMatch, getSeasonCenterCompetitionStats, "
    "getSeasonCenterRadarItems, getSeasonCenterEventFeed, seasonCenterEventDateLabel, "
    "isSeasonCenterActiveOffer, seasonCenterPhaseLabel"
    " } from './utils';\n"
)

def find_function_end(lines, start_idx):
    """Find the closing } of a function starting at start_idx (0-based).
    Returns the 0-based index of the last line of the function (the closing })."""
    # We need to track brace depth starting from the opening {
    # The function definition line has the opening {, or it might be on a following line
    depth = 0
    found_open = False
    for i in range(start_idx, len(lines)):
        line = lines[i]
        for ch in line:
            if ch == '{':
                depth += 1
                found_open = True
            elif ch == '}':
                depth -= 1
                if found_open and depth == 0:
                    return i
    return len(lines) - 1

def get_func_name_from_line(line):
    """Extract function name from a function declaration line."""
    # Match: function NAME( or async function NAME(
    m = re.match(r'^(?:async\s+)?function\s+(\w+)\s*\(', line)
    if m:
        return m.group(1)
    return None

def main():
    print(f"Reading {APP_FILE}...")
    with open(APP_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    print(f"Total lines: {len(lines)}")

    # Step 1: Add import line after line 41 (index 40)
    # Check if import already exists
    if "from './utils'" in content or 'from "./utils"' in content:
        print("WARNING: utils import already exists, skipping import addition")
    else:
        # Insert after index 40 (line 41 = index 40)
        lines.insert(41, IMPORT_LINE.rstrip('\n'))
        print("Added import line after line 41")

    # Step 2: Find and remove duplicate functions
    # We only want to remove functions that start at column 0 (module level)
    # i.e. "^function NAME(" or "^async function NAME("

    i = 0
    removed = []
    while i < len(lines):
        line = lines[i]
        # Only match module-level functions (not indented)
        m = re.match(r'^(?:async\s+)?function\s+(\w+)\s*\(', line)
        if m:
            func_name = m.group(1)
            if func_name in FUNCS_TO_REMOVE:
                end_idx = find_function_end(lines, i)
                # Remove from i to end_idx inclusive
                # Also remove trailing blank lines
                remove_end = end_idx + 1
                while remove_end < len(lines) and lines[remove_end].strip() == '':
                    remove_end += 1
                # Also remove leading blank lines before this function (already accounted for)
                func_lines_count = remove_end - i
                removed.append((func_name, i + 1, end_idx + 1))
                del lines[i:remove_end]
                print(f"Removed function {func_name} (was lines {i+1}-{end_idx+1}, removed {func_lines_count} lines)")
                # Don't increment i since we deleted lines
                continue
        i += 1

    print(f"\nTotal functions removed: {len(removed)}")
    print(f"Total lines after editing: {len(lines)}")

    # Write back
    new_content = '\n'.join(lines)
    with open(APP_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("File written successfully.")

    # Verify key markers
    lines_check = new_content.split('\n')
    for i, line in enumerate(lines_check):
        if "export default function App()" in line:
            print(f"  export default function App() found at line {i+1}")
            break

    # Check import is there
    for i, line in enumerate(lines_check[:45]):
        if "from './utils'" in line:
            print(f"  utils import found at line {i+1}")
            break

    # Report removed functions
    print("\nRemoved functions:")
    for name, start, end in removed:
        print(f"  {name} (original lines {start}-{end})")

if __name__ == '__main__':
    main()
