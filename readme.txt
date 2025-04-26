=== Form Send Blocks===
Contributors:      itmaroon
Tags:              block, Gutenberg, form, e-mail, contact
Requires at least: 6.3
Tested up to:      6.7.1
Stable tag:        1.1.3
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html
Requires PHP: 8.2.10

This is a block that summarizes the display screen when submitting a form.

== Related Links ==

* [Github](https://github.com/itmaroon/form-send-blocks)
* [source code](https://github.com/itmaroon/form-send-blocks/tree/master/src/blocks)
* [block-class-package:GitHub](https://github.com/itmaroon/block-class-package)  
* [block-class-package:Packagist](https://packagist.org/packages/itmar/block-class-package) 
* [itmar-block-packages:npm](https://www.npmjs.com/package/itmar-block-packages)  
* [itmar-block-packages:GitHub](https://github.com/itmaroon/itmar-block-packages)

== Description ==

An overview of the features is below.
- Provides three blocks: a form that houses a custom block for input, a form that confirms the input content, and a form that displays the results when the form is submitted.
- We provide a block that sends the content entered from the input block as a notification email to the set administrator and as an automatic response email to the user who entered it.
- It has a function to store the entered contents in the WordPress database.

Below is an overview of the functions of each block.
1.Input figure
This block is a block that stores Design Text Control, Design CheckBox, Design Select, and Design Button of BLOCK COLLECTIONS as an inner block and generates a submission form.
Blocks other than these cannot be stored, but there are no particular restrictions on the number.

2. Confirm figure
This block checks the contents entered in the Input Figure and generates a form for sending. Display your entries in a table for confirmation. Then click the submit button to submit the form.

3.Thanks Figure
This is a block that generates a form to display the submission results.
You can set the text of the transmission result and display its contents. You can set a fixed redirect page for the placed button.

4. Contact Mail Sender
This block stores the Design Process of Input Figure, Confirm Figure, Thanks Figure, and BLOCK COLLECTIONS as an inner block and generates an inquiry page by email.
We will send an email notifying you of the inquiry from the web page where this block is placed, as well as an automatic response email to the web page viewer who made the inquiry.
This content can be stored in the WordPress database, but the current version does not have the ability to display this content. This is a feature for future version upgrades.

== Installation ==

1. From the WP admin panel, click “Plugins” -> “Add new”.
2. In the browser input box, type “Block Collections”.
3. Select the “Block Collections” plugin and click “Install”.
4. Activate the plugin.

OR…

1. Download the plugin from this page.
2. Save the .zip file to a location on your computer.
3. Open the WP admin panel, and click “Plugins” -> “Add new”.
4. Click “upload”.. then browse to the .zip file downloaded from this page.
5. Click “Install”.. and then “Activate plugin”.

== Frequently Asked Questions ==



== Screenshots ==

1. Input form (before input)
2. Input form (after input)
3. Confirmation form
4. Transmission result display form
5. Input form (mobile)
6. Confirmation form (mobile)
7. Transmission result display form (mobile)

== Changelog ==
= 1.1.3 =
- Fixed the issue where the icon inverted display was not displayed properly when selecting a block.

= 1.1.2 =
- Fixed the redirect destination when returning to the home page to be set to the front-end home URL when the front-end is rendered.  

= 1.1.1 =
- Fixed text domain setting mistake. 
- The inner block monitoring mechanism has been reorganized to improve maintainability.


= 1.1.0 =
Correction
Corrected the function to align label widths with the addition of responsive font size function in Block Collection.
- Modified to be compatible with WordPress 6.5.
- PHP class management is now done using Composer.  
[GitHub](https://github.com/itmaroon/block-class-package)  
[Packagist](https://packagist.org/packages/itmar/block-class-package) 
- I decided to make functions and components common to other plugins into npm packages, and install and use them from npm.  
[npm](https://www.npmjs.com/package/itmar-block-packages)  
[GitHub](https://github.com/itmaroon/itmar-block-packages)

= 1.0.0 =
First public release

== Arbitrary section ==

1. Style settings that may require responsive support can be set separately for desktop mode (displayed on devices with a width of 768px or more) and mobile mode (displayed on devices with a width of 767px or less). To tell which setting is set, when you switch the display mode in the block editor or site editor, "(Desktop)" and "(Mobile)" will be displayed in the side menu display.
Please note that responsiveness for tablet display is not supported.
2. This plugin depends on the [BLOCK COLLECTIONS plugin](https://ja.wordpress.org/plugins/block-collections/). This plugin requires installation and activation in order to use it.
3. Regarding the display of text, etc., settings are made using WordPress's internationalization function, so it is possible to display text in multiple national languages. Currently, English and Japanese notation is possible.
4. The Contact Mail Sender block uses jquery.easing for screen transition animation. Therefore, when using this block, please comply with the following terms of use.
[jquery.easing/LICENSE-BSD-3-Clause.txt](https://github.com/gdsmith/jquery.easing/blob/master/LICENSE-BSD-3-Clause.txt)
5. We use wp_mail for email sending. Therefore, when sending emails from a local environment, it is necessary to install a plugin that provides an SMTP environment such as [WP Mail SMTP by WPForms](https://ja.wordpress.org/plugins/wp-mail-smtp/). Is required.
6. PHP class management is now done using Composer.  
[GitHub](https://github.com/itmaroon/block-class-package)  
[Packagist](https://packagist.org/packages/itmar/block-class-package) 
7. I decided to make functions and components common to other plugins into npm packages, and install and use them from npm.  
[npm](https://www.npmjs.com/package/itmar-block-packages)  
[GitHub](https://github.com/itmaroon/itmar-block-packages)
