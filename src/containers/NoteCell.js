import React, { Component } from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import GlobalStyles from "../Styles"
import Tag from "../models/app/tag"
import ActionSheet from 'react-native-actionsheet'
import ItemActionManager from '../lib/itemActionManager'

export default class NoteCell extends React.PureComponent {


  constructor(props) {
    super(props);
    this.state = {selected: false};
    let Padding = 14;

    this.styles = StyleSheet.create({

      noteCell: {
        padding: Padding,
        paddingRight: Padding * 2,
        borderBottomColor: GlobalStyles.constants().plainCellBorderColor,
        borderBottomWidth: 1,
        backgroundColor: GlobalStyles.constants().mainBackgroundColor,
      },

      noteCellSelected: {
        backgroundColor: GlobalStyles.constants().selectedBackgroundColor,
      },

      noteTags: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: 5,
      },

      pinnedView: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: 5,
      },

      pinnedText: {
        color: GlobalStyles.constants().mainTintColor,
        marginLeft: 8,
        fontWeight: "bold",
        fontSize: 12
      },

      noteTag: {
        marginRight: 2,
        fontSize: 12,
        color: GlobalStyles.constants().mainTextColor,
        opacity: 0.5,
      },

      noteTitle: {
        fontWeight: "bold",
        fontSize: GlobalStyles.constants().mainHeaderFontSize,
        color: GlobalStyles.constants().mainTextColor
      },

      noteText: {
        fontSize: GlobalStyles.constants().mainTextFontSize,
        marginTop: 4,
        color: GlobalStyles.constants().mainTextColor
      },

      noteDate: {
        marginTop: 5,
        fontSize: 12,
        color: GlobalStyles.constants().mainTextColor,
        opacity: 0.5
      },

      deleting: {
        color: GlobalStyles.constants().mainTintColor,
        marginBottom: 5,
      },

      highlight: {
        backgroundColor: GlobalStyles.constants().mainTintColor
      }
    });
  }

  _onPress = () => {
    this.setState({selected: true});
    this.props.onPressItem(this.props.item);
    this.setState({selected: false});
  };

  _onPressIn = () => {
    this.setState({selected: true});
  };

  _onPressOut = () => {
    this.setState({selected: false});
  };

  noteCellStyle = () => {
    if(this.state.selected) {
      return [styles.noteCell, styles.noteCellSelected];
    } else {
      return styles.noteCell;
    }
  }

  aggregateStyles(base, addition, condition) {
    if(condition) {
      return [base, addition];
    } else {
      return base;
    }
  }

  static ActionSheetCancelIndex = 0;
  static ActionSheetDestructiveIndex = 4;
  static highlightId = 0;

  actionSheetActions() {
    var pinAction = this.props.item.pinned ? "Unpin" : "Pin";
    let pinEvent = pinAction == "Pin" ? ItemActionManager.PinEvent : ItemActionManager.UnpinEvent;

    var archiveOption = this.props.item.archived ? "Unarchive" : "Archive";
    let archiveEvent = archiveOption == "Archive" ? ItemActionManager.ArchiveEvent : ItemActionManager.UnarchiveEvent;

    return [
      ['Cancel', ""],
      [pinAction, pinEvent],
      [archiveOption, archiveEvent],
      ['Share', ItemActionManager.ShareEvent],
      ['Delete', ItemActionManager.DeleteEvent]
    ];
  }

  showActionSheet = () => {
    this.actionSheet.show();
  }

  handleActionSheetPress = (index) => {
    if(index == 0) {
      return;
    }

    ItemActionManager.handleEvent(this.actionSheetActions()[index][1], this.props.item, () => {
      this.forceUpdate();
    }, () => {
      // afterConfirmCallback
      // We want to show "Deleting.." on top of note cell after the user confirms the dialogue
      this.forceUpdate();
    });

  }

  highlightSearchTerms = (note) => {
    const textStyle = this.aggregateStyles(this.styles.noteText, this.styles.noteTextSelected, this.state.selected);

    if (!this.props.searchTerm || this.props.searchTerm.length === 0) {
      return (<Text numberOfLines={2} style={textStyle}>{note.text}</Text>);
    }

    const searchTermRe = new RegExp(`(${this.props.searchTerm})`, 'i');
    // The number of characters in a note that displays varies by screen width.
    // As a rough estimate, assume that the max number of visible characters
    // is 280 (twice the twitter limit).
    const visibletext = note.text.slice(0, 280);
    // Split truncated text by searchterm, and also capture searchTerm matches
    const splitText = visibletext.split(searchTermRe);
    // Highlight occurences of searchterm in the visibleText.
    return (
      <Text numberOfLines={2} style={textStyle}>
        {splitText.map((text) => {
          if (searchTermRe.test(text)) {
            return (<Text key={note.uuid + '-highlight-' + NoteCell.highlightId++} style={this.styles.highlight}>{text}</Text>);
          } else {
            return text;
          }
        })}
      </Text>);
  }

  render() {
    var note = this.props.item;
    return (
       <TouchableWithoutFeedback onPress={this._onPress} onPressIn={this._onPressIn} onPressOut={this._onPressOut} onLongPress={this.showActionSheet}>
          <View style={this.aggregateStyles(this.styles.noteCell, this.styles.noteCellSelected, this.state.selected)} onPress={this._onPress}>

            {note.deleted &&
              <Text style={this.styles.deleting}>Deleting...</Text>
            }

            {note.conflictOf &&
              <Text style={this.styles.deleting}>Conflicted Copy</Text>
            }

            {note.pinned &&
              <View style={this.styles.pinnedView}>
                <Icon name={"ios-bookmark"} size={14} color={GlobalStyles.constants().mainTintColor} />
                <Text style={this.styles.pinnedText}>Pinned</Text>
              </View>
            }

            {this.props.renderTags && note.tags.length > 0 &&
              <View style={this.styles.noteTags}>
                <Text numberOfLines={1} style={this.aggregateStyles(this.styles.noteTag)}>
                {Tag.arrayToDisplayString(note.tags)}
                </Text>
              </View>
            }

            {note.errorDecrypting &&
              <View>
                <Text style={[this.styles.noteTitle, this.styles.deleting]}>
                  {"Password Required."}
                </Text>
                <Text numberOfLines={2} style={this.aggregateStyles(this.styles.noteText, this.styles.noteTextSelected, this.state.selected)}>
                  {"Please sign in to restore your decryption keys and notes."}
                </Text>
              </View>
            }

            {note.safeTitle().length > 0 &&
              <Text style={this.aggregateStyles(this.styles.noteTitle, this.styles.noteTitleSelected, this.state.selected)}>{note.title}</Text>
            }

          {note.safeText().length > 0 && this.highlightSearchTerms(note)}

            <Text
              numberOfLines={1}
              style={this.aggregateStyles(this.styles.noteDate, this.styles.noteDateSelected, this.state.selected)}>
              {this.props.sortType == "updated_at" ? "Modified " + note.updatedAt() : note.createdAt()}
            </Text>

            <ActionSheet
              ref={o => this.actionSheet = o}
              title={note.safeTitle()}
              options={this.actionSheetActions().map((action) => {return action[0]})}
              cancelButtonIndex={NoteCell.ActionSheetCancelIndex}
              destructiveButtonIndex={NoteCell.ActionSheetDestructiveIndex}
              onPress={this.handleActionSheetPress}
              {...GlobalStyles.actionSheetStyles()}
            />
        </View>
      </TouchableWithoutFeedback>
    )
  }
}
