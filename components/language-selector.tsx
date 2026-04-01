import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { Language } from "@/lib/i18n/config";

export interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => Promise<void>;
  disabled?: boolean;
}

const LANGUAGES: Array<{ code: Language; label: string; nativeLabel: string }> = [
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
];

/**
 * 언어 선택 드롭다운 컴포넌트
 */
export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  disabled = false,
}: LanguageSelectorProps) {
  const colors = useColors();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguageLabel = LANGUAGES.find((l) => l.code === currentLanguage);

  const handleSelectLanguage = async (language: Language) => {
    if (language === currentLanguage) {
      setIsOpen(false);
      return;
    }

    try {
      setIsChanging(true);
      await onLanguageChange(language);
      setIsOpen(false);
    } catch (error) {
      console.error("언어 변경 실패:", error);
    } finally {
      setIsChanging(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: "relative" as const,
    },
    button: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      minHeight: 44,
    },
    buttonText: {
      fontSize: 15,
      color: colors.foreground,
      fontWeight: "500" as const,
      flex: 1,
    },
    chevron: {
      marginLeft: 8,
    },
    modal: {
      flex: 1,
      justifyContent: "flex-end" as const,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 16,
      paddingBottom: 24,
      maxHeight: "60%",
    },
    modalHeader: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: colors.foreground,
    },
    optionsList: {
      paddingHorizontal: 0,
    },
    option: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionText: {
      fontSize: 15,
      color: colors.foreground,
      fontWeight: "500" as const,
    },
    optionSubText: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
    },
    selectedIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    selectedCheckmark: {
      fontSize: 14,
      color: "#fff",
      fontWeight: "bold" as const,
    },
    closeButton: {
      marginHorizontal: 20,
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.border,
      alignItems: "center" as const,
    },
    closeButtonText: {
      fontSize: 15,
      fontWeight: "600" as const,
      color: colors.foreground,
    },
  });

  return (
    <View style={styles.container}>
      {/* Selector Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsOpen(true)}
        disabled={disabled || isChanging}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.buttonText}>
            {currentLanguageLabel?.nativeLabel || "언어 선택"}
          </Text>
        </View>
        <IconSymbol
          name="chevron.right"
          size={18}
          color={colors.muted}
          style={styles.chevron}
        />
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>언어 선택</Text>
            </View>

            {/* Language Options */}
            <ScrollView style={styles.optionsList}>
              {LANGUAGES.map((language, index) => {
                const isSelected = language.code === currentLanguage;
                return (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.option,
                      index === LANGUAGES.length - 1 && { borderBottomWidth: 0 },
                      isSelected && {
                        backgroundColor: colors.primary + "10",
                      },
                    ]}
                    onPress={() => handleSelectLanguage(language.code)}
                    activeOpacity={0.7}
                    disabled={isChanging}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionText}>
                        {language.nativeLabel}
                      </Text>
                      <Text style={styles.optionSubText}>{language.label}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedCheckmark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
