<template>
  <div class="yc-login" :class="{ 'is-recaptcha': recaptcha }">
    <aside class="yc-login__brand">
      <div class="yc-login__brandtop">
        <span class="yc-login__mark">YC</span>
        <span class="yc-login__brandname">YCHub</span>
      </div>
      <h1>把 NAS 上的文件<br />装进一个顺手的界面</h1>
      <p class="yc-login__tagline">
        影尘 · 自托管文件管理。Win11 的秩序感，加上文件管理器该有的效率。
      </p>
      <ul class="yc-login__points">
        <li>
          <YcIcon name="image" :size="17" />
          浏览器里直接预览图片、视频、文档
        </li>
        <li>
          <YcIcon name="link" :size="17" />
          分享链接、有效期与访问密码
        </li>
        <li>
          <YcIcon name="columns" :size="17" />
          双栏对拷、标签与版本历史
        </li>
      </ul>
      <span class="yc-login__brandver">YCHub v{{ displayVersion }}</span>
    </aside>

    <div class="yc-login__pane">
      <form class="yc-login__card" @submit="submit">
        <div class="yc-login__logo-mobile">
          <span class="yc-login__mark">YC</span>
        </div>
        <h2>{{ createMode ? "创建账号" : "登录 YCHub" }}</h2>
        <p class="yc-login__sub">
          {{
            createMode
              ? "创建一个新账号，登录后即可管理文件"
              : "使用 NAS 系统账号，或管理员创建的账号登录"
          }}
        </p>

        <p v-if="reason != null" class="yc-login__notice">
          {{ t(`login.logout_reasons.${reason}`) }}
        </p>
        <p v-if="error !== ''" class="yc-login__error">{{ error }}</p>

        <label class="yc-field">
          <span class="yc-field__label">用户名</span>
          <input
            autofocus
            class="yc-input"
            type="text"
            autocapitalize="off"
            v-model="username"
            :placeholder="t('login.username')"
          />
        </label>

        <label class="yc-field">
          <span class="yc-field__label">密码</span>
          <input
            class="yc-input"
            type="password"
            v-model="password"
            :placeholder="t('login.password')"
          />
        </label>

        <label v-if="createMode" class="yc-field">
          <span class="yc-field__label">确认密码</span>
          <input
            class="yc-input"
            type="password"
            v-model="passwordConfirm"
            :placeholder="t('login.passwordConfirm')"
          />
        </label>

        <div v-if="recaptcha" id="recaptcha"></div>

        <button class="yc-btn yc-btn--primary yc-login__submit" type="submit">
          {{ createMode ? t("login.signup") : t("login.submit") }}
        </button>

        <p class="yc-login__switch" @click="toggleMode" v-if="signup">
          {{
            createMode ? t("login.loginInstead") : t("login.createAnAccount")
          }}
        </p>

        <p class="yc-login__hint">
          <YcIcon name="info" :size="13" />
          登录状态会保存在此浏览器，公共电脑请使用后退出
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { StatusError } from "@/api/utils";
import * as auth from "@/utils/auth";
import { recaptcha, recaptchaKey, signup, version } from "@/utils/constants";
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import YcIcon from "@/components/yc/YcIcon.vue";

// Define refs
const createMode = ref<boolean>(false);
const error = ref<string>("");
const username = ref<string>("");
const password = ref<string>("");
const passwordConfirm = ref<string>("");

const route = useRoute();
const router = useRouter();
const { t } = useI18n({});
// Define functions
const toggleMode = () => (createMode.value = !createMode.value);

const displayVersion = computed(() =>
  /^\d/.test(version) ? version : "1.0.0"
);

const $showError = inject<IToastError>("$showError")!;

const reason = route.query["logout-reason"] ?? null;

const submit = async (event: Event) => {
  event.preventDefault();
  event.stopPropagation();

  const redirect = (route.query.redirect || "/files/") as string;

  let captcha = "";
  if (recaptcha) {
    captcha = window.grecaptcha.getResponse();

    if (captcha === "") {
      error.value = t("login.wrongCredentials");
      return;
    }
  }

  if (createMode.value) {
    if (password.value !== passwordConfirm.value) {
      error.value = t("login.passwordsDontMatch");
      return;
    }
  }

  try {
    if (createMode.value) {
      await auth.signup(username.value, password.value);
    }

    await auth.login(username.value, password.value, captcha);
    router.push({ path: redirect });
  } catch (e: any) {
    // console.error(e);
    if (e instanceof StatusError) {
      if (e.status === 409) {
        error.value = t("login.usernameTaken");
      } else if (e.status === 403) {
        error.value = t("login.wrongCredentials");
      } else if (e.status === 400) {
        const match = e.message.match(/minimum length is (\d+)/);
        if (match) {
          error.value = t("login.passwordTooShort", { min: match[1] });
        } else {
          error.value = e.message;
        }
      } else {
        $showError(e);
      }
    }
  }
};

// Run hooks
onMounted(() => {
  document.body.classList.add("yc-login-mode");

  if (!recaptcha) return;

  window.grecaptcha.ready(function () {
    window.grecaptcha.render("recaptcha", {
      sitekey: recaptchaKey,
    });
  });
});

onBeforeUnmount(() => {
  document.body.classList.remove("yc-login-mode");
});
</script>

<style scoped>
.yc-login {
  min-height: 100vh;
  display: flex;
  background: var(--yc-bg);
}

.yc-login__brand {
  position: relative;
  flex: 0 0 46%;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  padding: 56px 56px 40px;
  color: #fff;
  background: linear-gradient(150deg, #4f6bff 0%, #6a5bff 52%, #7a4fff 100%);
  overflow: hidden;
}
.yc-login__brand::before,
.yc-login__brand::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  pointer-events: none;
}
.yc-login__brand::before {
  width: 420px;
  height: 420px;
  right: -140px;
  top: -120px;
}
.yc-login__brand::after {
  width: 260px;
  height: 260px;
  left: -80px;
  bottom: -90px;
  background: rgba(255, 255, 255, 0.07);
}

.yc-login__brandtop {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: auto;
  position: relative;
  z-index: 1;
}
.yc-login__mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: var(--yc-accent);
  background: #fff;
  box-shadow: 0 8px 20px rgba(20, 30, 80, 0.22);
}
.yc-login__brandname {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.yc-login__brand h1 {
  margin: 40px 0 14px;
  font-size: 32px;
  line-height: 1.35;
  font-weight: 700;
  letter-spacing: 0.2px;
  position: relative;
  z-index: 1;
}
.yc-login__tagline {
  margin: 0 0 28px;
  max-width: 400px;
  font-size: 13.5px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.82);
  position: relative;
  z-index: 1;
}
.yc-login__points {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 1;
}
.yc-login__points li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.94);
}
.yc-login__points li :deep(.yc-icon) {
  width: 32px;
  height: 32px;
  padding: 7px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.14);
  box-sizing: border-box;
}
.yc-login__brandver {
  margin-top: auto;
  padding-top: 36px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  position: relative;
  z-index: 1;
}

.yc-login__pane {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.yc-login__card {
  width: 100%;
  max-width: 400px;
  padding: 34px 32px 28px;
  background: var(--yc-surface);
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius-lg);
  box-shadow: var(--yc-shadow);
  display: flex;
  flex-direction: column;
}
.yc-login__logo-mobile {
  display: none;
}
.yc-login__card h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: var(--yc-text);
}
.yc-login__sub {
  margin: 0 0 22px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--yc-muted);
}

.yc-login__notice,
.yc-login__error {
  margin: 0 0 14px;
  padding: 9px 12px;
  border-radius: var(--yc-radius-sm);
  font-size: 12.5px;
  line-height: 1.5;
}
.yc-login__notice {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-login__error {
  background: var(--yc-danger-soft);
  color: var(--yc-danger);
}

.yc-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 14px;
}
.yc-field__label {
  font-size: 12px;
  color: var(--yc-text-2);
}
.yc-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius-sm);
  background: var(--yc-surface-2);
  color: var(--yc-text);
  font-family: inherit;
  font-size: 13px;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.yc-input:focus {
  outline: none;
  border-color: var(--yc-accent);
  background: var(--yc-surface);
  box-shadow: 0 0 0 3px var(--yc-accent-soft);
}
.yc-input::placeholder {
  color: var(--yc-muted);
}

.yc-login__submit {
  width: 100%;
  height: 42px;
  margin-top: 6px;
  font-size: 13.5px;
  font-weight: 600;
}

.yc-login__switch {
  margin: 14px 0 0;
  font-size: 12.5px;
  text-align: center;
  color: var(--yc-accent);
  cursor: pointer;
}
.yc-login__switch:hover {
  text-decoration: underline;
}

.yc-login__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 20px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--yc-border);
  font-size: 11px;
  line-height: 1.5;
  color: var(--yc-muted);
}

@media (max-width: 960px) {
  .yc-login__brand {
    display: none;
  }
  .yc-login__logo-mobile {
    display: block;
    margin-bottom: 16px;
  }
  .yc-login__logo-mobile .yc-login__mark {
    color: #fff;
    background: linear-gradient(135deg, #4f6bff, #7a5cff);
  }
  .yc-login__pane {
    padding: 24px 18px;
  }
  .yc-login__card {
    padding: 26px 22px 22px;
    box-shadow: none;
  }
}
</style>
