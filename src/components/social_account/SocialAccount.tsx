import React from "react";
import DefaultAvatar from "../../images/sasha_anon.png";
import { useSocialAccount } from "../../data/socialAccount";
import "./SocialAccount.scss";
import { accountTrim } from "../../data/utils";
// import LinkToAccountPage from "../../images/link_to_account_page.png";

export default function SocialAccount(props: {
  accountId: string;
  clickable: boolean;
}) {
  const accountId = props.accountId;
  const clickable = props.clickable;
  // const filterLink = props.filterLink;
  const socialAccount = useSocialAccount(accountId);
  const avatarUrl = socialAccount?.avatar?.url || DefaultAvatar;
  const shortenAccountId = accountTrim(accountId);
  const displayName = socialAccount?.displayName
    ? `${socialAccount.displayName} (${shortenAccountId})`
    : shortenAccountId;
  const accountUrl = `https://explorer.near.org/accounts/${accountId}`;
  const inner = (
    <div className="social-account">
      <img src={avatarUrl} title={accountId} alt={accountId} />
      <span title={accountId}>{displayName}</span>
    </div>
  );

  return (
    <>
      {clickable ? <a href={accountUrl}>{inner}</a> : inner}
      {/* {filterLink && (
        <a
          href={`/#account=${accountId}`}
          onClick={() => filterLink(accountId)}
        >
          <img
            src={LinkToAccountPage}
            title={`Filter ${accountId} actions`}
            alt={`Filter ${accountId} actions`}
            style={{ paddingLeft: "5px" }}
          />
        </a>
      )} */}
    </>
  );
}
